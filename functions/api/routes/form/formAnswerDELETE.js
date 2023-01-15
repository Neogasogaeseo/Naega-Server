const functions = require('firebase-functions');
const util = require('../../../lib/util');
const statusCode = require('../../../constants/statusCode');
const responseMessage = require('../../../constants/responseMessage');
const db = require('../../../db/db');
const slackAPI = require('../../../lib/slackAPI');
const { answerDB, keywordDB, linkAnswerKeywordDB } = require('../../../db');
const dayjs = require('dayjs');
const arrayHandler = require('../../../lib/arrayHandler');

module.exports = async (req, res) => {
  const user = req.user;
  const { answerId } = req.params;

  if (!user) return res.status(statusCode.BAD_REQUEST).send(util.fail(statusCode.BAD_REQUEST, responseMessage.NULL_VALUE));
  if (!answerId) {
    return res.status(statusCode.BAD_REQUEST).send(util.fail(statusCode.BAD_REQUEST, responseMessage.NULL_VALUE));
  }
  let client;

  try {
    client = await db.connect(req);

    //^_^// 해당 답변 get
    // answerId로 answer table 에서 해당 답변 찾는다
    // answer table 에서 얻은 link-user-form id값으로 링크 테이블에 접근
    // 거기서 user 테이블에 접근. 답변의 대상을 찾는다.

    const answer = await answerDB.getAnswerUserIdByAnswerId(client, answerId);
    if (!answer) {
      return res.status(statusCode.BAD_REQUEST).send(util.fail(statusCode.BAD_REQUEST, responseMessage.NO_ANSWER));
    }

    //^_^// 유저가 답변 받은 사람인지 확인
    if (answer.userId !== user.id) {
      return res.status(statusCode.UNAUTHORIZED).send(util.fail(statusCode.UNAUTHORIZED, responseMessage.NO_AUTH_MEMBER));
    }

    // ^_^// answer에 해당하는 키워드들을 전부 조회하고, 추출한 정보로 키워드들 가져옴
    const linkAnswerKeywords = await linkAnswerKeywordDB.getKeywordsWithAnswerIdList(client, [answerId]);
    console.log('linkAnswerKeywords : ', linkAnswerKeywords);

    // ^_^// 삭제한 answer에 담긴 키워드 삭제 (answer-keywordDB)
    const keywordIdsForDelete = arrayHandler.extractValues(linkAnswerKeywords, 'id');
    const deleteLinkFeedbackKeyword = await linkAnswerKeywordDB.deleteLinkAnswerKeyword(client, [answerId], keywordIdsForDelete);
    console.log('deleteLinkFeedbackKeyword : ', deleteLinkFeedbackKeyword);

    // // ^_^// 삭제한 keyword count-- 업데이트
    const deleteKeywords = await keywordDB.keywordCountDelete(client, keywordIdsForDelete);

    // // ^_^// answer 삭제 (with answerId)
    const deleteAnswer = await answerDB.deleteAnswer(client, [answerId]);

    return res.status(statusCode.OK).send(util.success(statusCode.OK, responseMessage.ANSWER_DELETE_SUCCESS));
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
