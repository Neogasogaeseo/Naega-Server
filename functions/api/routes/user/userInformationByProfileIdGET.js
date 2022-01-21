const functions = require('firebase-functions');
const util = require('../../../lib/util');
const statusCode = require('../../../constants/statusCode');
const responseMessage = require('../../../constants/responseMessage');
const db = require('../../../db/db');
const slackAPI = require('../../../middlewares/slackAPI');
const { userDB, linkFeedbacKeywordDB, linkAnswerKeywordDB } = require('../../../db');

module.exports = async (req, res) => {

  const { profileId } = req.params;
  
  if (!profileId) return res.status(statusCode.BAD_REQUEST).send(util.fail(statusCode.BAD_REQUEST, responseMessage.NULL_VALUE));
  
  let client;
  
  
  
  try {
    client = await db.connect(req);

    const userData = await userDB.getUserListByProfileId(client, profileId);
    if(!userData) { return res.status(statusCode.NOT_FOUND).send(util.fail(statusCode.NOT_FOUND, responseMessage.NO_USER));}
    const userId = userData.id;
    console.log("userId: ", userId);

    const teamKeywordList = await linkFeedbacKeywordDB.getTopKeywordListOnFeedback(client, userId);
    console.log("teamKeywordList: ", teamKeywordList);
    
    const answerKeywordList = await linkAnswerKeywordDB.getTopKeywordListOnAnswer(client, userId);
    console.log("answerKeyword: ", answerKeywordList);

    const resultData = {
      user: userData,
      teamKeywordList,
      answerKeywordList,
    }

    res.status(statusCode.OK).send(util.success(statusCode.OK, responseMessage.READ_USER_SUCCESS, resultData));
    
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