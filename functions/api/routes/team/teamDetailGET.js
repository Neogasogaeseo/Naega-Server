const functions = require('firebase-functions');
const util = require('../../../lib/util');
const statusCode = require('../../../constants/statusCode');
const responseMessage = require('../../../constants/responseMessage');
const db = require('../../../db/db');
const { teamDB } = require('../../../db');
const resizeImage = require('../../../middlewares/resizeImage');
const slackAPI = require('../../../middlewares/slackAPI');

module.exports = async (req, res) => {
  const { teamId } = req.params;

  if (!teamId) return res.status(statusCode.BAD_REQUEST).send(util.fail(statusCode.BAD_REQUEST, responseMessage.NULL_VALUE));

  let client;

  try {
    client = await db.connect(req);

    const team = await teamDB.getTeamById(client, teamId);
    const member = await teamDB.getMemberByTeamId(client, teamId);
    member.forEach((item) => (item.image = resizeImage(item.image)));
    const data = {
      team,
      memberCount: member.length,
      member,
    };
    res.status(statusCode.OK).send(util.success(statusCode.OK, responseMessage.READ_TEAM_SUCCESS, data));
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
