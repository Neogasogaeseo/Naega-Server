const functions = require('firebase-functions');
const util = require('../../../lib/util');
const statusCode = require('../../../constants/statusCode');
const responseMessage = require('../../../constants/responseMessage');
const db = require('../../../db/db');
const slackAPI = require('../../../lib/slackAPI');
const { teamDB, memberDB } = require('../../../db');

module.exports = async (req, res) => {

  const { teamId } = req.params;
  const { id: userId } = req.user;
  
  if (!userId || !teamId) return res.status(statusCode.BAD_REQUEST).send(util.fail(statusCode.BAD_REQUEST, responseMessage.NULL_VALUE));
  
  let client;
  
  
  
  try {
    client = await db.connect(req);

    const checkUser = await memberDB.checkMemberHost(client, userId, teamId);
    if (!checkUser) {
      //^_^// is_host가 false인 경우 조회 불가
      return res.status(statusCode.FORBIDDEN).send(util.fail(statusCode.FORBIDDEN, responseMessage.NO_AUTH_MEMBER));
    };
    
    //^_^// 팀 정보 조회
    const teamData = await teamDB.getTeamById (client, teamId);

    const resultData = {
        team: teamData
    };

    res.status(statusCode.OK).send(util.success(statusCode.OK, responseMessage.READ_TEAM, resultData));
    
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