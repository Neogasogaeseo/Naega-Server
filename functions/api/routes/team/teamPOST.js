const functions = require('firebase-functions');
const util = require('../../../lib/util');
const statusCode = require('../../../constants/statusCode');
const responseMessage = require('../../../constants/responseMessage');
const db = require('../../../db/db');
const { teamDB, memberDB } = require('../../../db');
const slackAPI = require('../../../middlewares/slackAPI');

module.exports = async (req, res) => {
  const { teamName, description, userIdList } = req.body;
  const imageUrls = req.imageUrls + '/team';

  //^_^// hostUser POST를 위해 토큰값에서 user.id 가져오기
  const { id: hostUserId } = req.user;

  //^_^// teamName 외에는 값이 없어도 ok
  if (!teamName) return res.status(statusCode.BAD_REQUEST).send(util.fail(statusCode.BAD_REQUEST, responseMessage.NULL_VALUE));

  let client;

  //^_^// const userId = [new Set(userIdList.map(o => o.userId))];

  try {
    client = await db.connect(req);
    //^_^// 팀 생성 POST
    const teamData = await teamDB.addTeam(client, teamName, imageUrls, description);

    //^_^// member POST를 위해 팀 생성 POST 후 만들어진 team.id 가져오기
    const { id: teamId } = teamData;

    //^_^// 팀을 생성하는 유저의 id만 is_confirmed, is_host true로 POST
    const hostMemberId = hostUserId;
    const hostMemberData = await memberDB.addHostMember(client, teamId, hostMemberId);

    //^_^// 그 외 member row값 POST
    const memberData = await memberDB.addMember(client, teamId, userIdList);

    const resultData = {
      team: teamData,
      hostMember: hostMemberData,
      member: memberData,
    };

    res.status(statusCode.OK).send(util.success(statusCode.OK, responseMessage.POST_TEAM, resultData));
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
