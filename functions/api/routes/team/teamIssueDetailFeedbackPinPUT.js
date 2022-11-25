const functions = require('firebase-functions');
const util = require('../../../lib/util');
const statusCode = require('../../../constants/statusCode');
const responseMessage = require('../../../constants/responseMessage');
const db = require('../../../db/db');
const slackAPI = require('../../../lib/slackAPI');
const { feedbackDB } = require('../../../db');

module.exports = async (req, res) => {
  const { feedbackId } = req.params;
  const user = req.user;
  console.log('feecbackId : ', feedbackId);
  if (!feedbackId) return res.status(statusCode.BAD_REQUEST).send(util.fail(statusCode.BAD_REQUEST, responseMessage.NULL_VALUE));

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

    const toggleIsPinnedFeedback = await feedbackDB.toggleIsPinnedFeedback(client, feedbackId);

    console.log('toggleIsPinnedFeedback :', toggleIsPinnedFeedback);
    res.status(statusCode.OK).send(util.success(statusCode.OK, responseMessage.ANSWER_IS_PINNED_TOGGLE_SUCCESS, toggleIsPinnedFeedback));
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
