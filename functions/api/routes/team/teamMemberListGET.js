const functions = require('firebase-functions');
const util = require('../../../lib/util');
const statusCode = require('../../../constants/statusCode');
const responseMessage = require('../../../constants/responseMessage');
const db = require('../../../db/db');
const { memberDB, teamDB } = require('../../../db');
const slackAPI = require('../../../lib/slackAPI');

module.exports = async (req, res) => {
  const user = req.user;
  const { teamId } = req.params;
  if (!user || !teamId) return res.status(statusCode.BAD_REQUEST).send(util.fail(statusCode.BAD_REQUEST, responseMessage.NULL_VALUE));

  let client;
  try {
    client = await db.connect(req);

    const member = await memberDB.getMemberByTeamId(client, teamId);
    if (member.length < 1) return res.status(statusCode.NOT_FOUND).send(util.fail(statusCode.NOT_FOUND, responseMessage.NO_TEAM));
    const checkUser = member.find((m) => m.id == user.id);
    if (!checkUser) return res.status(statusCode.FORBIDDEN).send(util.fail(statusCode.FORBIDDEN, responseMessage.NO_MEMBER));

    let teamMember = await memberDB.getAllTeamMemberByTeamId(client, teamId);
    teamMember = teamMember.filter(function (x) {
      if (x.id != user.id) return x;
    });

    return res.status(statusCode.OK).send(util.success(statusCode.OK, responseMessage.READ_ALL_TEAM_MEMBER, teamMember));
  } catch (error) {
    functions.logger.error(`[ERROR] [${req.method.toUpperCase()}] ${req.originalUrl}`, `[CONTENT] ${error}`);
    console.log(error);

    const slackMessage = `[ERROR] [${req.method.toUpperCase()}] ${req.originalUrl} ${req.user ? `uid:${req.user.id}` : 'req.user 없음'} 
    ${JSON.stringify(error)}`;
    slackAPI.sendMessageToSlack(slackMessage, slackAPI.DEV_WEB_HOOK_ERROR_MONITORING);
    return res.status(statusCode.INTERNAL_SERVER_ERROR).send(util.fail(statusCode.INTERNAL_SERVER_ERROR, responseMessage.INTERNAL_SERVER_ERROR));
  } finally {
    client.release();
  }
};
