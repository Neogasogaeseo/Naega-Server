const functions = require('firebase-functions');
const util = require('../../../lib/util');
const statusCode = require('../../../constants/statusCode');
const responseMessage = require('../../../constants/responseMessage');
const db = require('../../../db/db');
const slackAPI = require('../../../lib/slackAPI');
const { memberDB, teamDB } = require('../../../db');

module.exports = async (req, res) => {
  const { id: userId } = req.user;
  const { offset, limit } = req.query;

  if (!userId || !offset || !limit) return res.status(statusCode.BAD_REQUEST).send(util.fail(statusCode.BAD_REQUEST, responseMessage.NULL_VALUE));

  let client;

  try {
    client = await db.connect(req);

    const tempTeamIdList = await memberDB.getInvitedTeamIdList(client, userId, offset, limit);
    const invitedTeamIdList = tempTeamIdList.filter((o) => {
      if (o.isDeleted === true && o.isConfirmed === true) return false;
      return true;
    });
    const teamIdList = invitedTeamIdList.map((o) => o.teamId);
    if (teamIdList.length === 0) {
      const notice = [];
      return res.status(statusCode.OK).send(util.success(statusCode.OK, responseMessage.READ_ALL_NOTICE_SUCCESS, { notice }));
    }
    const teamList = await teamDB.getTeamListByTeamIdList(client, teamIdList);

    const noticeList = teamIdList.map((id) => {
      const item = { id, team: {}, invitation: {} };
      return item;
    });

    teamList.map((o) => {
      const item = noticeList.find((e) => e.id === o.id);
      item.team = o;
      return o;
    });
    invitedTeamIdList.map((o) => {
      const item = noticeList.find((e) => e.id === o.teamId);
      delete o.teamId;
      item.invitation = o;
      return o;
    });
    noticeList.forEach((o) => delete o.id);
    const notice = noticeList.filter((o) => o.team.isDeleted === false);

    res.status(statusCode.OK).send(util.success(statusCode.OK, responseMessage.READ_ALL_NOTICE_SUCCESS, { notice }));
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
