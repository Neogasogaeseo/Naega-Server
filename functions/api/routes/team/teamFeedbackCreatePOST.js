const functions = require('firebase-functions');
const util = require('../../../lib/util');
const statusCode = require('../../../constants/statusCode');
const responseMessage = require('../../../constants/responseMessage');
const db = require('../../../db/db');
// const slackAPI = require('../../../middlewares/slackAPI');
const { feedbackDB, linkFeedbacKeywordDB } = require('../../../db');

module.exports = async (req, res) => {
  const user = req.user;
  const { issueId, taggedUserId, content, keywordId } = req.body;

  if (!user) return res.status(statusCode.BAD_REQUEST).send(util.fail(statusCode.BAD_REQUEST, responseMessage.NULL_VALUE));
  if (!issueId || !taggedUserId || !content || !keywordId) {
    return res.status(statusCode.BAD_REQUEST).send(util.fail(statusCode.BAD_REQUEST, responseMessage.NULL_VALUE));
  }
  let client;

  try {
    client = await db.connect(req);

    const addFeedback = await feedbackDB.addFeedback(client, issueId, user.id, taggedUserId, content);
    console.log('addFeedback :', addFeedback);

    // const addLinkFeedbackKeyword = await linkFeedbacKeywordDB.addLinkFeedbackKeyword(client,);

    res.status(statusCode.OK).send(util.success(statusCode.OK, responseMessage.ADD_FEEDBACK_SUCCESS, addFeedback));
  } catch (error) {
    functions.logger.error(`[ERROR] [${req.method.toUpperCase()}] ${req.originalUrl}`, `[CONTENT] ${error}`);
    console.log(error);

    const slackMessage = `[ERROR] [${req.method.toUpperCase()}] ${req.originalUrl} ${req.user ? `uid:${req.user.id}` : 'req.user 없음'}
 ${JSON.stringify(error)}`;
    // slackAPI.sendMessageToSlack(slackMessage, slackAPI.DEV_WEB_HOOK_ERROR_MONITORING);
    res.status(statusCode.INTERNAL_SERVER_ERROR).send(util.fail(statusCode.INTERNAL_SERVER_ERROR, responseMessage.INTERNAL_SERVER_ERROR));
  } finally {
    client.release();
  }
};
