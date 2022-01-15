const functions = require('firebase-functions');
const util = require('../../../lib/util');
const statusCode = require('../../../constants/statusCode');
const responseMessage = require('../../../constants/responseMessage');
const db = require('../../../db/db');
const { teamDB } = require('../../../db')

module.exports = async (req, res) => {

  const {teamId, teamName, image, description, addedUserIdList} = req.body
  const { id: userId } = req.user;
  
  let client;
    
  
  try {
    client = await db.connect(req);

    const checkUser = await teamDB.checkMemberTeam(client, userId, teamId);
    if (checkUser.length === 0) {
        return res.status(statusCode.UNAUTHORIZED).send(util.fail(statusCode.UNAUTHORIZED, responseMessage.NO_AUTH_MEMBER));
    };

    const teamData = await teamDB.updateTeam(client, teamId, teamName, description, image);

    const memberData = await teamDB.addMember(client, teamId, addedUserIdList);

    resultData = {
        team: teamData,
        member: memberData
    };
    
    res.status(statusCode.OK).send(util.success(statusCode.OK, responseMessage.READ_ALL_USERS_SUCCESS, resultData));
    
  } catch (error) {
    functions.logger.error(`[ERROR] [${req.method.toUpperCase()}] ${req.originalUrl}`, `[CONTENT] ${error}`);
    console.log(error);
    
    res.status(statusCode.INTERNAL_SERVER_ERROR).send(util.fail(statusCode.INTERNAL_SERVER_ERROR, responseMessage.INTERNAL_SERVER_ERROR));
    
  } finally {
    client.release();
  }
};