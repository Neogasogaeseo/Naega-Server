const functions = require('firebase-functions');
const util = require('../../../lib/util');
const statusCode = require('../../../constants/statusCode');
const responseMessage = require('../../../constants/responseMessage');
const db = require('../../../db/db');
const { memberDB } = require('../../../db');
const resizeImage = require('../../../lib/resizeImage');
const slackAPI = require('../../../lib/slackAPI');

module.exports = async (req, res) => {
  const { id: userId } = req.user;

  if (!userId) return res.status(statusCode.BAD_REQUEST).send(util.fail(statusCode.BAD_REQUEST, responseMessage.NULL_VALUE));

  let client;

  try {
    client = await db.connect(req);

    const myIssueList = await memberDB.getAllTeamByUserId(client, userId);
    const myTeamList = myIssueList.filter((o) => !o.isDeleted);
    const myTeamUniqueList = myTeamList.filter((team, index, arr) => {
      return arr.findIndex((item) => item.id === team.id && item.name === team.name) === index;
    });

    myTeamUniqueList.forEach((item) => {
      delete item.createdAt;
      delete item.isDeleted;
      item.image = resizeImage(item.image);
    });

    res.status(statusCode.OK).send(util.success(statusCode.OK, responseMessage.READ_ALL_TEAM_SUCCESS, myTeamUniqueList));
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
