const functions = require('firebase-functions');
const util = require('../../../lib/util');
const statusCode = require('../../../constants/statusCode');
const responseMessage = require('../../../constants/responseMessage');
const db = require('../../../db/db');
const { issueDB } = require('../../../db');

module.exports = async (req, res) => {
  const { userId } = req.body;

  if (!userId) return res.status(statusCode.BAD_REQUEST).send(util.fail(statusCode.BAD_REQUEST, responseMessage.NULL_VALUE));
  let client;

  try {
    client = await db.connect(req);

    let resultList = [];
    const myIssueList = await issueDB.getAllIssueByUserId(client, userId);

    for (const issue of myIssueList) {
      const categoryName = issue.categoryName;
      const createdAt = issue.createdAt;
      const content = issue.content;
      const myFeedbackPersonList = await issueDB.getAllFeedbackPersonList(client, userId, issue.id);
      resultList.push({
        categoryName: categoryName,
        createdAt: createdAt,
        content: content,
        feedbackPersonList: myFeedbackPersonList,
        teamName: issue.teamName,
        userName: issue.userName,
      });
    }

    res.status(statusCode.OK).send(util.success(statusCode.OK, responseMessage.READ_ALL_USERS_SUCCESS, resultList));
  } catch (error) {
    functions.logger.error(`[ERROR] [${req.method.toUpperCase()}] ${req.originalUrl}`, `[CONTENT] ${error}`);
    console.log(error);

    res.status(statusCode.INTERNAL_SERVER_ERROR).send(util.fail(statusCode.INTERNAL_SERVER_ERROR, responseMessage.INTERNAL_SERVER_ERROR));
  } finally {
    client.release();
  }
};
