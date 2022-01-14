const functions = require('firebase-functions');
const util = require('../../../lib/util');
const statusCode = require('../../../constants/statusCode');
const responseMessage = require('../../../constants/responseMessage');
const db = require('../../../db/db');
const { issueDB } = require('../../../db');

const extractValues = (arr, key) => {
  if (!Array.isArray(arr)) return [arr[key] || null];
  return [...new Set(arr.map((o) => o[key]).filter(Boolean))];
};

module.exports = async (req, res) => {
  const { id: userId } = req.user;
  if (!userId) return res.status(statusCode.BAD_REQUEST).send(util.fail(statusCode.BAD_REQUEST, responseMessage.NULL_VALUE));

  let client;

  try {
    client = await db.connect(req);

    const myIssueIdRecentList = await issueDB.getIssueIdRecentListByUserId(client, userId);
    const idList = extractValues(myIssueIdRecentList, 'id');

    let myIssue = await issueDB.getIssueByIssueId(client, idList);
    for (const issue of myIssue) {
      issue.createdAt = issue.createdAt.getFullYear() + '-' + issue.createdAt.getMonth() + 1 + '-' + issue.createdAt.getDate();

    }

    const myFeedbackPersonList = await issueDB.getAllFeedbackPersonList(client, idList);
    const feedbackUnique = myFeedbackPersonList.filter((feedback, index, arr) => {
      return arr.findIndex((item) => item.name === feedback.name && item.id === feedback.id) === index;
    });
    const feedbackList = feedbackUnique.reduce((result, feedback) => {
      const a = result.find(({ id }) => id === feedback.id);
      a ? a.feedback.push(feedback) : result.push({ id: feedback.id, feedback: [feedback] });
      return result;
    }, []);

    const map = new Map();
    myIssue.forEach((item) => map.set(item.id, item));
    feedbackList.forEach((item) => map.set(item.id, { ...map.get(item.id), ...item }));
    const resultList = Array.from(map.values());

    res.status(statusCode.OK).send(util.success(statusCode.OK, responseMessage.READ_MY_ISSUE_SUCCESS, resultList));
  } catch (error) {
    functions.logger.error(`[ERROR] [${req.method.toUpperCase()}] ${req.originalUrl}`, `[CONTENT] ${error}`);
    console.log(error);

    res.status(statusCode.INTERNAL_SERVER_ERROR).send(util.fail(statusCode.INTERNAL_SERVER_ERROR, responseMessage.INTERNAL_SERVER_ERROR));
  } finally {
    client.release();
  }
};
