const functions = require('firebase-functions');
const util = require('../../../lib/util');
const statusCode = require('../../../constants/statusCode');
const responseMessage = require('../../../constants/responseMessage');
const db = require('../../../db/db');
const { teamDB, memberDB } = require('../../../db');
const slackAPI = require('../../../lib/slackAPI');

module.exports = async (req, res) => {
  const { teamId, teamName, image, description, addedUserIdList } = req.body;
  const { id: userId } = req.user;

  let client;

  try {
    client = await db.connect(req);

    const checkUser = await memberDB.checkMemberHost(client, userId, teamId);
    if (!checkUser) {
      //^_^// is_host가 false인 경우 수정하지 못하도록 함
      return res.status(statusCode.FORBIDDEN).send(util.fail(statusCode.FORBIDDEN, responseMessage.NO_AUTH_MEMBER));
    }

    //^_^// 팀 정보 수정
    const teamData = await teamDB.updateTeam(client, teamId, teamName, description, image);

    //^_^// 해당 팀에 이미 멤버가 있는 경우는 user검색에서 filter되도록 처리했음
    const memberData = await memberDB.addMember(client, teamId, addedUserIdList);

    const resultData = {
      team: teamData,
      member: memberData,
    };

    res.status(statusCode.OK).send(util.success(statusCode.OK, responseMessage.READ_ALL_USERS_SUCCESS, resultData));
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
