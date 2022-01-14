const functions = require('firebase-functions');
const util = require('../../../lib/util');
const statusCode = require('../../../constants/statusCode');
const responseMessage = require('../../../constants/responseMessage');
const db = require('../../../db/db');
const { teamDB } = require('../../../db');

module.exports = async (req, res) => {

  const { name, image, description, userIdList } = req.body
  const hostUser = req.user[id]

  
  if (!name) return res.status(statusCode.BAD_REQUEST).send(util.fail(statusCode.BAD_REQUEST, responseMessage.NULL_VALUE));
  
  let client;
  
  const userId = [new Set(userIdList.map(o => o.userId))];
  
  try {
    client = await db.connect(req);

    const teamData = await teamDB.addTeam(client, name, image, description);

    const hostMemberId = hostUser;
    const hostMemberData = await teamDB.addHostMember(client, teamId, hostMemberId)

    const teamId = teamData.id;
    const memberData = await teamDB.addMember(client, teamId, userId);

    const resultData = {
      team: teamData,
      hostMember: hostMemberData,
      member: [memberData]
    }
    
    res.status(statusCode.OK).send(util.success(statusCode.OK, responseMessage.POST_TEAM, resultData));
    
  } catch (error) {
    functions.logger.error(`[ERROR] [${req.method.toUpperCase()}] ${req.originalUrl}`, `[CONTENT] ${error}`);
    console.log(error);
    
    res.status(statusCode.INTERNAL_SERVER_ERROR).send(util.fail(statusCode.INTERNAL_SERVER_ERROR, responseMessage.INTERNAL_SERVER_ERROR));
    
  } finally {
    client.release();
  }
};