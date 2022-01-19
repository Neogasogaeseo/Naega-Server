const functions = require('firebase-functions');
const util = require('../../../lib/util');
const statusCode = require('../../../constants/statusCode');
const responseMessage = require('../../../constants/responseMessage');
const db = require('../../../db/db');
const slackAPI = require('../../../middlewares/slackAPI');
const { answerDB, feedbackDB } = require('../../../db');

module.exports = async (req, res) => {
  const user = req.user;
  const { formId } = req.params;

  if (!formId) {
    return res.status(statusCode.BAD_REQUEST).send(util.fail(statusCode.BAD_REQUEST, responseMessage.NULL_VALUE));
  }
  let client;

  try {
    client = await db.connect(req);

    // // ^_^// formId로 해당 이슈에 해당하는 모든 feedback 가져옴
    // const answers = await answerDB.쿼리문이름(client,formId);

    // // // ^_^// issueId로 해당 이슈에 해당하는 모든 feedback 가져옴
    // // const feedbacks = await feedbackDB.getFeedbacks(client, issueId);
    // // for (const feedback of feedbacks) {
    // //   feedback.createdAt = dayjs(feedback.createdAt).format('YYYY-MM-DD');
    // // }
    // // console.log('feedbacks : ', feedbacks);

    // // // ^_^// 가져온 feedbacks들의 id만 추출
    // // const feedbackIds = arrayHandler.extractValues(feedbacks, 'id');
    // // console.log('feedbackIds : ', feedbackIds);

    // // // ^_^// 추출한 feedbacks들로 키워드들 가져옴
    // // const linkFeedbackKeywords = await linkFeedbacKeywordDB.getKeywords(client, feedbackIds);
    // // console.log('linkFeedbackKeywords : ', linkFeedbackKeywords);

    // // // ^_^// 추출한 feedbakcs
    // // const feedbacksTofind = feedbacks.reduce((acc, x) => {
    // //   acc[x.id] = { ...x, keywords: [] };
    // //   return acc;
    // // }, {});
    // // console.log('feedbacksTofind', feedbacksTofind);

    // // linkFeedbackKeywords.map((o) => {
    // //   feedbacksTofind[o.feedbackId].keywords.push(o);
    // //   return o;
    // // });
    // // console.log(feedbacksTofind);

    // const issueDetailFeedback = Object.entries(feedbacksTofind).map(([feedbackId, data]) => ({ ...data }));
    // console.log('issueDetailFeedback', issueDetailFeedback);

    res.status(statusCode.OK).send(util.success(statusCode.OK, responseMessage.READ_ALL_USERS_SUCCESS));
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