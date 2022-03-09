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
  const { issueId, taggedUserId, content, keywordIds } = req.body;

  if (!user) return res.status(statusCode.BAD_REQUEST).send(util.fail(statusCode.BAD_REQUEST, responseMessage.NULL_VALUE));
  if (!issueId || !taggedUserId || !content || !keywordIds) {
    return res.status(statusCode.BAD_REQUEST).send(util.fail(statusCode.BAD_REQUEST, responseMessage.NULL_VALUE));
  }
  let client;

  try {
    client = await db.connect(req);

    //^_^// 피드백 추가
    const newFeedback = await feedbackDB.addFeedback(client, issueId, user.id, taggedUserId, content);
    newFeedback.createdAt = dayjs(newFeedback.createdAt).format('YYYY-MM-DD');

    //^_^// feedback x Keyword 테이블에 row 추가
    const addLinkFeedbackKeyword = await linkFeedbacKeywordDB.addLinkFeedbackKeyword(client, newFeedback.id, keywordIds);
    //^_^// 추가된 Keyword의 count 업데이트
    const keywordCountUpdate = await keywordDB.keywordCountUpdate(client, keywordIds);

    const taggedUserProfileId = await userDB.gettaggedUserProfileId(client, taggedUserId);

    const data = { taggedUserProfileId: taggedUserProfileId.profileId, feecbackId: newFeedback.id, createdAt: newFeedback.createdAt };
    res.status(statusCode.OK).send(util.success(statusCode.OK, responseMessage.ADD_FEEDBACK_SUCCESS, data));
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
