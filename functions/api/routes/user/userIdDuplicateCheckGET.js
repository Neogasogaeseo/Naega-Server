const functions = require('firebase-functions');
const util = require('../../../lib/util');
const statusCode = require('../../../constants/statusCode');
const responseMessage = require('../../../constants/responseMessage');
const db = require('../../../db/db');
const { userDB } = require('../../../db');
const slackAPI = require('../../../lib/slackAPI');

module.exports = async (req, res) => {

  const user = req.user;
  const { profileId } = req.params;
  
  if (!profileId) return res.status(statusCode.BAD_REQUEST).send(util.fail(statusCode.BAD_REQUEST,responseMessage.NULL_VALUE));

  let client;
  
  
  
  try {
    client = await db.connect(req);

    const checkUser = await userDB.checkUserProfileId(client, profileId);

    //^_^// 중복되는 아이디가 있을 때
    if (checkUser && checkUser.id != user.id) {
      return res.status(statusCode.OK).send(util.success(statusCode.OK, responseMessage.DUPLICATE_USER_PROFILE_ID));
   };

    //^_^// 중복되는 아이디가 없을 때
    res.status(statusCode.NO_CONTENT).send(util.success(statusCode.NO_CONTENT));
    
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