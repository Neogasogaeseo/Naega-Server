const functions = require('firebase-functions');
const util = require('../../../lib/util');
const statusCode = require('../../../constants/statusCode');
const responseMessage = require('../../../constants/responseMessage');
const db = require('../../../db/db');
const { issueDB } = require('../../../db');

module.exports = async (req, res) => {
  const { teamId } = req.body;

  if (!teamId) return res.status(statusCode.BAD_REQUEST).send(util.fail(statusCode.BAD_REQUEST, responseMessage.NULL_VALUE));

  let client;

  try {
    client = await db.connect(req);

    let resultList = [];
    const myIssueIdRecentList = await issueDB.getIssueIdRecentListByTeamId(client, teamId);
    for (const issue of myIssueIdRecentList) {
      const myIssue = await issueDB.getIssueByIssueId(client, issue.id);
      const myFeedbackPersonList = await issueDB.getAllFeedbackPersonList(client, issue.id);
      const createdAt = myIssue.createdAt;
      resultList.push({
        categoryName: myIssue.categoryName,
        createdAt: createdAt.getFullYear() + '-' + createdAt.getMonth() + 1 + '-' + createdAt.getDate(),
        content: myIssue.content,
        feedbackPersonList: myFeedbackPersonList,
        teamName: myIssue.teamName,
        userName: myIssue.userName,
      });
    }
    res.status(statusCode.OK).send(util.success(statusCode.OK, responseMessage.READ_TEAM_ISSUE_SUCCESS, resultList));
  } catch (error) {
    functions.logger.error(`[ERROR] [${req.method.toUpperCase()}] ${req.originalUrl}`, `[CONTENT] ${error}`);
    console.log(error);

    res.status(statusCode.INTERNAL_SERVER_ERROR).send(util.fail(statusCode.INTERNAL_SERVER_ERROR, responseMessage.INTERNAL_SERVER_ERROR));
  } finally {
    client.release();
  }
};
