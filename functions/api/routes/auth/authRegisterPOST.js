const axios = require('axios');
const util = require('../../../lib/util');
const statusCode = require('../../../constants/statusCode');
const responseMessage = require('../../../constants/responseMessage');
const db = require('../../../db/db');
const { userDB } = require('../../../db');
const jwtHandlers = require('../../../lib/jwtHandlers');
const slackAPI = require('../../../lib/slackAPI');

module.exports = async (req, res) => {
  const { id: userId, profileId: userProfileId } = req.user;
  const { profileId, name, provider } = req.body;
  const imageUrls = req.imageUrls;
  let client;
  let kakao_profile = '';
  if (!profileId || !name || !provider) {
    return res.status(statusCode.BAD_REQUEST).send(util.fail(statusCode.BAD_REQUEST, responseMessage.NULL_VALUE));
  }

  try {
    client = await db.connect();
    if (userProfileId) {
      return res.status(statusCode.FORBIDDEN).send(util.fail(statusCode.FORBIDDEN, responseMessage.REGISTERED_USER));
    }
    const check = await userDB.checkUserProfileId(client, profileId);
    if (check) {
      return res.status(statusCode.NO_CONTENT).send(util.fail(statusCode.NO_CONTENT, responseMessage.DUPLICATE_USER_PROFILE_ID));
    }

    const tempUser = await userDB.addUser(client, profileId, name, kakao_profile.data.id, provider, imageUrls);
    const accesstoken = jwtHandlers.sign(tempUser);
    const refreshtoken = jwtHandlers.refresh(tempUser);
    const user = await userDB.updateRefreshTokenById(client, tempUser.id, refreshtoken);

    return res.status(statusCode.OK).send(util.success(statusCode.OK, responseMessage.CREATED_USER, { user, accesstoken }));
  } catch (error) {
    const slackMessage = `[ERROR] [${req.method.toUpperCase()}] ${req.originalUrl} ${req.user ? `uid:${req.user.id}` : 'req.user 없음'}
    ${JSON.stringify(error)}`;
    slackAPI.sendMessageToSlack(slackMessage, slackAPI.DEV_WEB_HOOK_ERROR_MONITORING);

    res.status(statusCode.INTERNAL_SERVER_ERROR).send(util.fail(statusCode.INTERNAL_SERVER_ERROR, responseMessage.INTERNAL_SERVER_ERROR));
  } finally {
    client.release();
  }
};
