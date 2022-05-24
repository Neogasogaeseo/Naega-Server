const functions = require('firebase-functions');
const util = require('../../../lib/util');
const statusCode = require('../../../constants/statusCode');
const responseMessage = require('../../../constants/responseMessage');
const db = require('../../../db/db');
const slackAPI = require('../../../lib/slackAPI');
const { issueDB, memberDB } = require('../../../db');
const dayjs = require('dayjs');
const resizeImage = require('../../../lib/resizeImage');
const _ = require('lodash');

module.exports = async (req, res) => {
  const { id: userId } = req.user;
  const { issueId } = req.params;

  if (!issueId) return res.status(statusCode.BAD_REQUEST).send(util.fail(statusCode.BAD_REQUEST, responseMessage.NULL_VALUE));

  let client;

  try {
    client = await db.connect(req);

    const member = await issueDB.getTeamMemberByIssueId(client, issueId);
    if (member.length < 1) return res.status(statusCode.NOT_FOUND).send(util.fail(statusCode.NOT_FOUND, responseMessage.NO_ISSUE));
    const checkUser = member.find((m) => m.id == userId);
    if (!checkUser) return res.status(statusCode.FORBIDDEN).send(util.fail(statusCode.FORBIDDEN, responseMessage.NO_MEMBER));

    // ^_^// 이슈 디테일 가져오기
    let getIssueDetail = await issueDB.getIssueDetailByIssueId(client, issueId);

    if (!getIssueDetail) {
      return res.status(statusCode.NOT_FOUND).send(util.success(statusCode.NOT_FOUND, responseMessage.NO_ISSUE_ID));
    }

    getIssueDetail.createdAt = dayjs(getIssueDetail.createdAt).format('YYYY-MM-DD');
    // console.log('getIssueDetail : ', getIssueDetail);
    // ^_^// 해당 이슈 팀 정보 가져오기
    const getTeamForIssueDetail = await issueDB.getTeamForIssueDetailByIssueId(client, issueId);

    //^_^// feedback taged된 사람 가져오기
    const myFeedbackPersonList = await issueDB.getAllFeedbackPersonList(client, [issueId]);
    myFeedbackPersonList.forEach((item) => (item.image = resizeImage(item.image)));

    const feedbackUnique = myFeedbackPersonList.filter((feedback, index, arr) => {
      return arr.findIndex((item) => item.name === feedback.name && item.id === feedback.id) === index;
    });

    const user = { id: getIssueDetail.userId, name: getIssueDetail.userName };
    getIssueDetail = _.omit(getIssueDetail, ['userId', 'userName']);

    const data = { user: user, issue: { ...getIssueDetail }, team: getTeamForIssueDetail, feedbackTagged: feedbackUnique };
    return res.status(statusCode.OK).send(util.success(statusCode.OK, responseMessage.READ_TEAM_ISSUE_DETAIL_SUCCESS, data));
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
