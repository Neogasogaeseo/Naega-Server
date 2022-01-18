const functions = require('firebase-functions');
const dayjs = require('dayjs');
const util = require('../../../lib/util');
const statusCode = require('../../../constants/statusCode');
const responseMessage = require('../../../constants/responseMessage');
const db = require('../../../db/db');
const { issueDB } = require('../../../db');
const resizeImage = require('../../../middlewares/resizeImage');

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

    //^_^// issueId 최신순 정렬 완료
    const myIssueIdRecentList = await issueDB.getIssueIdRecentListByTeamIdAndUserId(client, teamId, userId);
    if (myIssueIdRecentList.length === 0) {
      client.release();
      return res.status(statusCode.OK).send(util.success(statusCode.OK, responseMessage.NO_TEAM_ISSUE_CONTENT));
    }
    const idList = extractValues(myIssueIdRecentList, 'id');

    //^_^// issue id로 issue 정보 가져오기 완료
    const myIssue = await issueDB.getIssueByIssueId(client, idList);
    for (const issue of myIssue) {
      issue.createdAt = dayjs(issue.createdAt).format('YYYY-MM-DD');
    }
    const myTeam = await issueDB.getTeamByIssueId(client, idList);
    myTeam.forEach((item) => (item.teamImage = resizeImage(item.teamImage)));

    //^_^// feedback 당한 사람 가져오기 완료
    const myFeedbackPersonList = await issueDB.getAllFeedbackPersonList(client, idList);
    myFeedbackPersonList.forEach((item) => (item.image = resizeImage(item.image)));
    const feedbackUnique = myFeedbackPersonList.filter((feedback, index, arr) => {
      return arr.findIndex((item) => item.name === feedback.name && item.id === feedback.id) === index;
    });
    const feedbackList = feedbackUnique.reduce((result, feedback) => {
      const a = result.find(({ id }) => id === feedback.id);
      a ? a.feedback.push(feedback) : result.push({ id: feedback.id, feedback: [feedback] });
      return result;
    }, []);

    //^_^// 합치기 완료
    const map = new Map();
    feedbackList.forEach((item) => map.set(item.id, item));
    myIssue.forEach((item) => map.set(item.id, { ...map.get(item.id), ...item }));
    myTeam.forEach((item) => map.set(item.id, { ...map.get(item.id), ...item }));
    const resultList = Array.from(map.values());

    res.status(statusCode.OK).send(util.success(statusCode.OK, responseMessage.READ_TEAM_ISSUE_SUCCESS, resultList));
  } catch (error) {
    functions.logger.error(`[ERROR] [${req.method.toUpperCase()}] ${req.originalUrl}`, `[CONTENT] ${error}`);
    console.log(error);

    res.status(statusCode.INTERNAL_SERVER_ERROR).send(util.fail(statusCode.INTERNAL_SERVER_ERROR, responseMessage.INTERNAL_SERVER_ERROR));
  } finally {
    client.release();
  }
};
