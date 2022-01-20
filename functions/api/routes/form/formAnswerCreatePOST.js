const functions = require('firebase-functions');
const util = require('../../../lib/util');
const statusCode = require('../../../constants/statusCode');
const responseMessage = require('../../../constants/responseMessage');
const db = require('../../../db/db');
const slackAPI = require('../../../middlewares/slackAPI');
const { answerDB, linkAnswerKeywordDB } = require('../../../db');

module.exports = async (req, res) => {

  const {linkFormId, name, relationshipId, content, keywordList } = req.body;
  if (!linkFormId || !name || !relationshipId || !content) return res.status(statusCode.BAD_REQUEST).send(util.fail(statusCode.BAD_REQUEST, responseMessage.NULL_VALUE));
    
  let client;
  
  
  try {
    client = await db.connect(req);

    const answerData = await answerDB.addAnswer(client, linkFormId, name, relationshipId, content);
    if (answerData === null) return res.status(statusCode.BAD_REQUEST).send(util.fail(statusCode.BAD_REQUEST, responseMessage.NO_FORM));

    const { id: answerId } = answerData;
    
    let keywordData;
    if (!keywordList) {
      keywordData = [];
    }else {
      keywordData = await linkAnswerKeywordDB.addLinkAnswerKeyword(client, answerId, keywordList);
    };

    const resultData = {
      answer: answerData,
      keyword: keywordData
    };
    
    res.status(statusCode.OK).send(util.success(statusCode.OK, responseMessage.ANSWER_CREATE_SUCCESS, resultData));
    
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