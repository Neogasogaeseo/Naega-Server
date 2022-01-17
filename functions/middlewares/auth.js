const functions = require('firebase-functions');
const jwtHandlers = require('../lib/jwtHandlers');
const db = require('../db/db');
const util = require('../lib/util');
const statusCode = require('../constants/statusCode');
const responseMessage = require('../constants/responseMessage');
const { userDB } = require('../db');
const { TOKEN_INVALID, TOKEN_EXPIRED } = require('../constants/jwt');

const checkUser = async (req, res, next) => {
  const { accesstoken, refreshtoken } = req.headers;

  if (!accesstoken) return res.status(statusCode.BAD_REQUEST).send(util.fail(statusCode.BAD_REQUEST, responseMessage.TOKEN_EMPTY));

  let client;
  try {
    client = await db.connect(req);
    let userId;
    let needNewAccessToken = false;
    let needNewRefreshToken = false;
    let decodedRefreshToken = '';

    const decodedAccessToken = jwtHandlers.verify(accesstoken);
    if (refreshtoken) {
      decodedRefreshToken = jwtHandlers.verify(refreshtoken);
    }
    if (decodedAccessToken === TOKEN_INVALID && decodedRefreshToken === TOKEN_INVALID)
      return res.status(statusCode.UNAUTHORIZED).send(util.fail(statusCode.UNAUTHORIZED, responseMessage.TOKEN_INVALID));

    if (decodedAccessToken === TOKEN_EXPIRED) {
      if (decodedRefreshToken === TOKEN_EXPIRED) {
        return res.status(statusCode.UNAUTHORIZED).send(util.fail(statusCode.UNAUTHORIZED, responseMessage.TOKEN_EXPIRED));
      } else if (decodedRefreshToken !== TOKEN_EXPIRED) {
        userId = decodedRefreshToken.id;
        needNewAccessToken = true;
      }
    } else {
      userId = decodedAccessToken.id;
      if (decodedRefreshToken === TOKEN_EXPIRED) {
        needNewRefreshToken = true;
      }
    }

    if (!userId) return res.status(statusCode.UNAUTHORIZED).send(util.fail(statusCode.UNAUTHORIZED, responseMessage.TOKEN_INVALID));

    let user = await userDB.getUserById(client, userId);

    if (!user) return res.status(statusCode.UNAUTHORIZED).send(util.fail(statusCode.UNAUTHORIZED, responseMessage.NO_USER));

    if (needNewAccessToken) {
      const { newAccessToken } = jwtHandlers.sign(user);
      user = { ...user, newAccessToken };
    }

    if (needNewRefreshToken) {
      const { newRefreshToken } = jwtHandlers.refresh(user);
      const refreshtoken = await userDB.updateRefreshTokenById(client, userId, newRefreshToken);
    }

    req.user = user;
    next();
  } catch (error) {
    console.log(error);
    functions.logger.error(`[AUTH ERROR] [${req.method.toUpperCase()}] ${req.originalUrl}`, accesstoken);
    res.status(statusCode.INTERNAL_SERVER_ERROR).send(util.fail(statusCode.INTERNAL_SERVER_ERROR, responseMessage.INTERNAL_SERVER_ERROR));
  } finally {
    client.release();
  }
};

module.exports = { checkUser };
