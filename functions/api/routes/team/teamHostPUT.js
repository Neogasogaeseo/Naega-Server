const functions = require('firebase-functions');
const util = require('../../../lib/util');
const statusCode = require('../../../constants/statusCode');
const responseMessage = require('../../../constants/responseMessage');
const db = require('../../../db/db');
const slackAPI = require('../../../lib/slackAPI');
const { memberDB } = require('../../../db');

module.exports = async (req, res) => {
  const { id: userId } = req.user;
  const { teamId, memberId } = req.body;

  if (!userId || !teamId || !memberId) return res.status(statusCode.BAD_REQUEST).send(util.fail(statusCode.BAD_REQUEST, responseMessage.NULL_VALUE));

  let client;

  try {
    client = await db.connect(req);

    const isHost = await memberDB.checkMemberHost(client, userId, teamId);
    const isMember = await memberDB.checkMemberTeam(client, memberId, teamId);
    if (!isHost) {
      return res.status(statusCode.FORBIDDEN).send(util.success(statusCode.FORBIDDEN, responseMessage.NO_AUTH_MEMBER));
    }
    if (!isMember) {
      return res.status(statusCode.FORBIDDEN).send(util.success(statusCode.FORBIDDEN, responseMessage.NO_MEMBER));
    }

    const oldHost = await memberDB.updateOldHost(client, userId, teamId);
    const newHost = await memberDB.updateNewHost(client, memberId, teamId);

    res.status(statusCode.OK).send(util.success(statusCode.OK, responseMessage.DELEGATE_HOST_SUCCESS, { oldHost, newHost }));
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
