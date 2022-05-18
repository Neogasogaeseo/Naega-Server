const functions = require('firebase-functions');
const util = require('../../../lib/util');
const arrayHandler = require('../../../lib/arrayHandler');
const statusCode = require('../../../constants/statusCode');
const responseMessage = require('../../../constants/responseMessage');
const db = require('../../../db/db');
const dayjs = require('dayjs');
const { feedbackDB, linkFeedbacKeywordDB, issueDB, memberDB } = require('../../../db');
const slackAPI = require('../../../lib/slackAPI');

module.exports = async (req, res) => {
  const { id: userId } = req.user;
  const { issueId } = req.params;

  if (!issueId) return res.status(statusCode.BAD_REQUEST).send(util.fail(statusCode.BAD_REQUEST, responseMessage.NULL_VALUE));

  let client;

  try {
    client = await db.connect(req);

    const team = await issueDB.getTeamIdByIssueId(client, issueId);
    if (!team) return res.status(statusCode.NOT_FOUND).send(util.fail(statusCode.NOT_FOUND, responseMessage.NO_ISSUE));

    const checkUser = await memberDB.checkMemberTeam(client, userId, team.teamId);
    if (!checkUser) return res.status(statusCode.FORBIDDEN).send(util.fail(statusCode.FORBIDDEN, responseMessage.NO_MEMBER));

    // ^_^// issueId로 해당 이슈에 해당하는 모든 feedback 가져옴
    let feedbacks = await feedbackDB.getFeedbacks(client, issueId);
    if (feedbacks.length === 0) {
      return res.status(statusCode.OK).send(util.success(statusCode.OK, responseMessage.NO_ISSUE_FEEDBACK, []));
    }
    for (const feedback of feedbacks) {
      feedback.createdAt = dayjs(feedback.createdAt).format('YYYY-MM-DD');
    }
    // console.log('feedbacks : ', feedbacks);

    // ^_^// 가져온 feedbacks들의 id만 추출
    const feedbackIds = arrayHandler.extractValues(feedbacks, 'id');
    // console.log('feedbackIds : ', feedbackIds);

    // ^_^// 추출한 feedbacks들로 키워드들 가져옴
    const linkFeedbackKeywords = await linkFeedbacKeywordDB.getKeywordsWithFeedbackIdList(client, feedbackIds);
    // console.log('linkFeedbackKeywords : ', linkFeedbackKeywords);

    // ^_^// 추출한 feedbacks
    const feedbacksTofind = feedbacks.reduce((acc, x) => {
      acc[x.id] = { ...x, keywords: [] };
      return acc;
    }, {});
    // console.log('feedbacksTofind', feedbacksTofind);

    linkFeedbackKeywords.map((o) => {
      feedbacksTofind[o.feedbackId].keywords.push(o);
      return o;
    });
    console.log(feedbacksTofind);

    const issueDetailFeedback = Object.entries(feedbacksTofind).map(([feedbackId, data]) => ({ ...data }));
    // console.log('issueDetailFeedback', issueDetailFeedback);

    res.status(statusCode.OK).send(util.success(statusCode.OK, responseMessage.READ_ISSUE_FEEDBACK_SUCCESS, issueDetailFeedback));
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
