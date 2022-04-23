const functions = require('firebase-functions');
const util = require('../../../lib/util');
const statusCode = require('../../../constants/statusCode');
const responseMessage = require('../../../constants/responseMessage');
const db = require('../../../db/db');
const slackAPI = require('../../../lib/slackAPI');
const { feedbackDB, linkFeedbacKeywordDB, keywordDB, userDB } = require('../../../db');
const dayjs = require('dayjs');

module.exports = async (req, res) => {
  const user = req.user;
  const { feedbackId } = req.params;
  const { taggedUserId, content, keywordIds } = req.body;

  if (!user) return res.status(statusCode.BAD_REQUEST).send(util.fail(statusCode.BAD_REQUEST, responseMessage.NULL_VALUE));
  if (!feedbackId) {
    return res.status(statusCode.BAD_REQUEST).send(util.fail(statusCode.BAD_REQUEST, responseMessage.NULL_VALUE));
  }
  let client;

  try {
    client = await db.connect(req);

    //^_^// 해당 피드백 get
    const feedback = await feedbackDB.getFeedbackById(client, feedbackId);
    console.log('feedback :', feedback);
    //^_^// 유저가 작성자/피드백 받은 사람 중 한명인지 확인
    if (feedback.userId !== user.id && feedback.taggedUserId !== user.id) {
      return res.status(statusCode.UNAUTHORIZED).send(util.fail(statusCode.UNAUTHORIZED, responseMessage.NO_AUTH_MEMBER));
    }
    //^_^// 작성된 내용으로 피드백 수정
    const edittedFeedback = await feedbackDB.editFeedback(client, feedbackId, taggedUserId, content);
    // newFeedback.createdAt = dayjs(newFeedback.createdAt).format('YYYY-MM-DD');
    console.log('edittedFeedback :', edittedFeedback);

    // ^_^// 추출한 feedback으로 키워드들 가져옴
    const linkFeedbackKeywords = await linkFeedbacKeywordDB.getKeywordsWithFeedbackIdList(client, [feedbackId]);
    console.log('linkFeedbackKeywords : ', linkFeedbackKeywords);

    //^_^// 기존의 키워드 아이디와 비교, 지워진 키워드는 삭제하고, 새로운 키워드가 있다면 추가한다

    //^_^// feedback x Keyword 테이블에 row 추가
    // const addLinkFeedbackKeyword = await linkFeedbacKeywordDB.addLinkFeedbackKeyword(client, newFeedback.id, keywordIds);

    //^_^// 지워진 Keyword의 count --
    // const keywordCountUpdate = await keywordDB.keywordCountUpdate(client, keywordIds);

    // const taggedUserProfileId = await userDB.gettaggedUserProfileId(client, taggedUserId);

    // const data = { taggedUserProfileId: taggedUserProfileId.profileId, feecbackId: newFeedback.id, createdAt: newFeedback.createdAt };
    res.status(statusCode.OK).send(util.success(statusCode.OK, responseMessage.ADD_FEEDBACK_SUCCESS));
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
