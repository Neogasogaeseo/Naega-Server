const functions = require('firebase-functions');
const util = require('../../../lib/util');
const statusCode = require('../../../constants/statusCode');
const responseMessage = require('../../../constants/responseMessage');
const db = require('../../../db/db');
const slackAPI = require('../../../lib/slackAPI');
const { feedbackDB, linkFeedbacKeywordDB, keywordDB, userDB } = require('../../../db');
const dayjs = require('dayjs');
const arrayHandler = require('../../../lib/arrayHandler');

module.exports = async (req, res) => {
  const user = req.user;
  const { feedbackId } = req.params;

  if (!user) return res.status(statusCode.BAD_REQUEST).send(util.fail(statusCode.BAD_REQUEST, responseMessage.NULL_VALUE));
  if (!feedbackId) {
    return res.status(statusCode.BAD_REQUEST).send(util.fail(statusCode.BAD_REQUEST, responseMessage.NULL_VALUE));
  }
  let client;

  try {
    client = await db.connect(req);

    //^_^// 해당 피드백 get
    const feedback = await feedbackDB.getFeedbackById(client, feedbackId);
    if (!feedback) {
      return res.status(statusCode.BAD_REQUEST).send(util.fail(statusCode.BAD_REQUEST, responseMessage.NO_ISSUE_FEEDBACK));
    }
    //^_^// 유저가 작성자/피드백 받은 사람 중 한명인지 확인
    if (feedback.userId !== user.id && feedback.taggedUserId !== user.id) {
      return res.status(statusCode.FORBIDDEN).send(util.fail(statusCode.FORBIDDEN, responseMessage.NO_AUTH_MEMBER));
    }
    // ^_^// 추출한 feedback으로 키워드들 가져옴
    const linkFeedbackKeywords = await linkFeedbacKeywordDB.getKeywordsWithFeedbackIdList(client, [feedbackId]);
    console.log('linkFeedbackKeywords : ', linkFeedbackKeywords);

    // ^_^// 삭제한 feedback에 담긴 키워드 삭제
    const keywordIdsBeforeUpdate = arrayHandler.extractValues(linkFeedbackKeywords, 'id');
    const deleteLinkFeedbackKeyword = await linkFeedbacKeywordDB.deleteLinkFeedbackKeyword(client, feedbackId, keywordIdsBeforeUpdate);

    // ^_^// 삭제한 keyword count-- 업데이트
    const deleteKeywords = await keywordDB.keywordCountDelete(client, keywordIdsBeforeUpdate);

    // ^_^// feedback 삭제
    const deleteFeedback = await feedbackDB.deleteFeedback(client, feedbackId);

    return res.status(statusCode.OK).send(util.success(statusCode.OK, responseMessage.DELETE_FEEDBACK_SUCCESS));
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
