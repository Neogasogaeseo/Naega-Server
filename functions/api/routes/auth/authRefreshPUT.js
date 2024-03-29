const functions = require('firebase-functions');
const util = require('../../../lib/util');
const statusCode = require('../../../constants/statusCode');
const responseMessage = require('../../../constants/responseMessage');
const db = require('../../../db/db');
const slackAPI = require('../../../lib/slackAPI');
const { userDB } = require('../../../db');
const jwtHandlers = require('../../../lib/jwtHandlers');
const { TOKEN_INVALID, TOKEN_EXPIRED } = require('../../../constants/jwt');

module.exports = async (req, res) => {
  const { refreshToken } = req.body;

  if (!refreshToken) {
    return res.status(statusCode.BAD_REQUEST).send(util.fail(statusCode.BAD_REQUEST, responseMessage.NULL_VALUE));
  }

  let client;

  try {
    client = await db.connect(req);

    const tokenUser = jwtHandlers.verify(refreshToken);
    if (tokenUser == TOKEN_EXPIRED) {
      return res.status(statusCode.BAD_REQUEST).send(util.fail(statusCode.BAD_REQUEST, responseMessage.TOKEN_EXPIRED));
    }
    if (tokenUser == TOKEN_INVALID) {
      return res.status(statusCode.BAD_REQUEST).send(util.fail(statusCode.BAD_REQUEST, responseMessage.TOKEN_INVALID));
    }

    const tempUser = await userDB.getUserById(client, tokenUser.id);
    const accesstoken = jwtHandlers.sign(tempUser);
    const refreshtoken = jwtHandlers.refresh(tempUser);
    const user = await userDB.updateRefreshTokenById(client, tempUser.id, refreshtoken);

    res.status(statusCode.OK).send(util.success(statusCode.OK, responseMessage.TOKEN_REFRESH_SUCCESS, { user, accesstoken }));
  } catch (error) {
    functions.logger.error(`[ERROR] [${req.method.toUpperCase()}] ${req.originalUrl}`, `[CONTENT] ${error}`);
    console.log(error);

    const slackMessage = `[ERROR] [${req.method.toUpperCase()}] ${req.originalUrl} ${req.user ? `uid:${req.user.id}` : 'req.user 없음'}
 ${JSON.stringify(error)}`;
    slackAPI.sendMessageToSlack(slackMessage, slackAPI.DEV_WEB_HOOK_ERROR_MONITORING);
    res.status(statusCode.INTERNAL_SERVER_ERROR).send(util.fail(statusCode.INTERNAL_SERVER_ERROR, responseMessage.INTERNAL_SERVER_ERROR));
  } finally {
    client.release();
  }
};
