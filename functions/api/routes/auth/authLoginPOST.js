const axios = require('axios');
const util = require('../../../lib/util');
const statusCode = require('../../../constants/statusCode');
const responseMessage = require('../../../constants/responseMessage');
const db = require('../../../db/db');
const { userDB } = require('../../../db');
const jwtHandlers = require('../../../lib/jwtHandlers');
const qs = require('qs');
const slackAPI = require('../../../lib/slackAPI');

module.exports = async (req, res) => {
  const { provider, authenticationCode } = req.body;
  let socialToken;
  let kakao_profile;
  let authUser;
  let client;
  if (!authenticationCode) {
    return res.status(statusCode.BAD_REQUEST).send(util.fail(statusCode.BAD_REQUEST, responseMessage.NULL_VALUE));
  }
  try {
    socialToken = await axios({
      method: 'POST',
      url: 'https://kauth.kakao.com/oauth/token',
      headers: {
        'content-type': 'application/x-www-form-urlencoded;charset=utf-8',
      },
      data: qs.stringify({
        code: authenticationCode,
        grant_type: 'authorization_code',
        client_id: process.env.KAKAO_KEY,
        redirect_uri: process.env.KAKAO_URI,
        client_secret: process.env.KAKAO_SECRET,
      }),
    });
  } catch (error) {
    console.log(error);
    return res.status(statusCode.NOT_FOUND).json(util.fail(statusCode.NOT_FOUND, responseMessage.WRONG_AUTH));
  }

  try {
    kakao_profile = await axios.get('https://kapi.kakao.com/v2/user/me', {
      headers: {
        Authorization: 'Bearer ' + socialToken.data.access_token,
        'Content-Type': 'application/json',
      },
    });
  } catch (error) {
    return res.status(statusCode.NOT_FOUND).json(util.fail(statusCode.NOT_FOUND, responseMessage.WRONG_TOKEN));
  }

  try {
    client = await db.connect();
    authUser = await userDB.getUserByAuthenticationCode(client, kakao_profile.data.id); //^_^// kakao id == auth code
    if (!authUser) {
      const tempUser = await userDB.addUser(client, '', '', kakao_profile.data.id, provider, '');
      const accesstoken = jwtHandlers.sign(tempUser);
      const refreshtoken = jwtHandlers.refresh(tempUser);
      const user = await userDB.updateRefreshTokenById(client, tempUser.id, refreshtoken);

      return res.status(statusCode.OK).send(util.success(statusCode.OK, responseMessage.CREATED_USER, { user, accesstoken }));
    } else {
      const accesstoken = jwtHandlers.sign(authUser);
      const refreshtoken = jwtHandlers.refresh(authUser);
      const user = await userDB.updateRefreshTokenById(client, authUser.id, refreshtoken);

      return res.status(statusCode.OK).send(util.success(statusCode.OK, responseMessage.LOGIN_SUCCESS, { user, accesstoken }));
    }
  } catch (error) {
    const slackMessage = `[ERROR] [${req.method.toUpperCase()}] ${req.originalUrl} ${req.user ? `uid:${req.user.id}` : 'req.user 없음'}
    ${JSON.stringify(error)}`;
    slackAPI.sendMessageToSlack(slackMessage, slackAPI.DEV_WEB_HOOK_ERROR_MONITORING);
  } finally {
    res.status(statusCode.INTERNAL_SERVER_ERROR).send(util.fail(statusCode.INTERNAL_SERVER_ERROR, responseMessage.INTERNAL_SERVER_ERROR));
    client.release();
  }
};
