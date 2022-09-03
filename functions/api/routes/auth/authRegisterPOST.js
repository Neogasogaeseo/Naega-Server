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
  if (!profileId || !name || !provider) {
    return res.status(statusCode.BAD_REQUEST).send(util.fail(statusCode.BAD_REQUEST, responseMessage.NULL_VALUE));
  }

  try {
    client = await db.connect();
    if (userId && userProfileId) {
      return res.status(statusCode.FORBIDDEN).send(util.fail(statusCode.FORBIDDEN, responseMessage.REGISTERED_USER));
    }
    const checkUser = await userDB.checkUserProfileId(client, profileId);
    if (checkUser && checkUser.id != userId) {
      return res.status(statusCode.NO_CONTENT).send(util.fail(statusCode.NO_CONTENT, responseMessage.DUPLICATE_USER_PROFILE_ID));
    }

    let tempUser;
    if (imageUrls) tempUser = await userDB.updateUserInformationIncludeImage(client, userId, profileId, name, imageUrls);
    else tempUser = await userDB.updateUserInformationWithoutImage(client, userId, profileId, name);

    const accesstoken = jwtHandlers.sign(tempUser);
    const refreshtoken = jwtHandlers.refresh(tempUser);
    const user = await userDB.updateRefreshTokenById(client, tempUser.id, refreshtoken);

    return res.status(statusCode.OK).send(util.success(statusCode.OK, responseMessage.REGISTER_USER_SUCCESS, { user, accesstoken }));
  } catch (error) {
    const slackMessage = `[ERROR] [${req.method.toUpperCase()}] ${req.originalUrl} ${req.user ? `uid:${req.user.id}` : 'req.user 없음'}
    ${JSON.stringify(error)}`;
    slackAPI.sendMessageToSlack(slackMessage, slackAPI.DEV_WEB_HOOK_ERROR_MONITORING);

    res.status(statusCode.INTERNAL_SERVER_ERROR).send(util.fail(statusCode.INTERNAL_SERVER_ERROR, responseMessage.INTERNAL_SERVER_ERROR));
  } finally {
    client.release();
  }
};
