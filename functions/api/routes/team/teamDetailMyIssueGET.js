const functions = require('firebase-functions');
const dayjs = require('dayjs');
const util = require('../../../lib/util');
const statusCode = require('../../../constants/statusCode');
const responseMessage = require('../../../constants/responseMessage');
const db = require('../../../db/db');
const { issueDB, memberDB, teamDB } = require('../../../db');
const resizeImage = require('../../../lib/resizeImage');
const slackAPI = require('../../../lib/slackAPI');

const extractValues = (arr, key) => {
  if (!Array.isArray(arr)) return [arr[key] || null];
  return [...new Set(arr.map((o) => o[key]).filter(Boolean))];
};

module.exports = async (req, res) => {
  const { id: userId } = req.user;
  const { teamId } = req.params;

  if (!teamId) return res.status(statusCode.BAD_REQUEST).send(util.fail(statusCode.BAD_REQUEST, responseMessage.NULL_VALUE));

  let client;

  try {
    client = await db.connect(req);

    const team = await teamDB.getTeamById(client, teamId);
    if (!team) return res.status(statusCode.NOT_FOUND).send(util.success(statusCode.NOT_FOUND, responseMessage.NO_TEAM));

    const user = await memberDB.checkMemberTeam(client, userId, teamId);
    if (!user) return res.status(statusCode.FORBIDDEN).send(util.success(statusCode.FORBIDDEN, responseMessage.NO_MEMBER));

    //^_^// issueId 최신순 정렬 완료
    const myIssueIdRecentList = await issueDB.getIssueIdRecentListByTeamIdAndUserId(client, teamId, userId);
    if (myIssueIdRecentList.length === 0) {
      return res.status(statusCode.OK).send(util.success(statusCode.OK, responseMessage.NO_TEAM_ISSUE_CONTENT));
    }
    const idList = extractValues(myIssueIdRecentList, 'id');

    //^_^// issue id로 issue 정보 가져오기 완료
    const myIssue = await issueDB.getIssueByIssueId(client, idList);
    for (const issue of myIssue) {
      issue.createdAt = dayjs(issue.createdAt).format('YYYY-MM-DD');
    }
    const myTeam = await issueDB.getTeamByIssueIdList(client, idList);
    myTeam.forEach((item) => (item.image = resizeImage(item.image)));

    //^_^// feedback 당한 사람 가져오기 완료
    const myFeedbackPersonList = await issueDB.getAllFeedbackPersonList(client, idList);
    myFeedbackPersonList.forEach((item) => (item.image = resizeImage(item.image)));
    const feedbackUnique = myFeedbackPersonList.filter((feedback, index, arr) => {
      return arr.findIndex((item) => item.name === feedback.name && item.issueId === feedback.issueId) === index;
    });
    const myFeedbackList = feedbackUnique.reduce((result, feedback) => {
      const a = result.find(({ id }) => id === feedback.issueId);
      a ? a.feedback.push(feedback) : result.push({ id: feedback.issueId, feedback: feedback ? [feedback] : [] });
      return result;
    }, []);

    //^_^// 합치기 완료
    const map = new Map();
    myIssue.forEach((item) => map.set(item.id, item));
    myFeedbackList.forEach((item) => map.set(item.id, { ...map.get(item.id), ...item }));
    const tempList = Array.from(map.values());
    tempList.forEach((item) => {
      if (item.feedback) item.feedback.forEach((o) => delete o.issueId);
      else item.feedback = [];
    });

    myTeam.forEach((team) => map.set(team.issueId, { ...map.get(team.issueId), team }));
    const resultList = Array.from(map.values());

    resultList.forEach((item) => {
      delete item.team.issueId;
    });

    res.status(statusCode.OK).send(util.success(statusCode.OK, responseMessage.READ_TEAM_ISSUE_SUCCESS, resultList));
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
