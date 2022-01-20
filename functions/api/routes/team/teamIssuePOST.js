const functions = require('firebase-functions');
const util = require('../../../lib/util');
const statusCode = require('../../../constants/statusCode');
const responseMessage = require('../../../constants/responseMessage');
const db = require('../../../db/db');
const { issueDB, memberDB } = require('../../../db');

module.exports = async (req, res) => {

  const { teamId, categoryId, content } = req.body;
  const imageUrls = req.imageUrls;
  const { id: userId } = req.user;
  
  if (!teamId || !categoryId || !content) return res.status(statusCode.BAD_REQUEST).send(util.fail(statusCode.BAD_REQUEST, responseMessage.NULL_VALUE));
  const intTeamId = Number(teamId);

  let client;
  
  
  
  try {
    client = await db.connect(req);

    const checkMemberList = await memberDB.checkMemberTeam(client, userId, intTeamId);
    if(!checkMemberList) {
      //^_^// 유저가 해당 팀의 팀원이 아닐 경우 error 리턴
      return res.status(statusCode.UNAUTHORIZED).send(util.fail(statusCode.UNAUTHORIZED, responseMessage.NO_MEMBER));
    }

    const issueData = await issueDB.addIssue(client, userId, intTeamId, categoryId, content, imageUrls);
    
    res.status(statusCode.OK).send(util.success(statusCode.OK, responseMessage.POST_TEAM_ISSUE, issueData));
    
  } catch (error) {
    functions.logger.error(`[ERROR] [${req.method.toUpperCase()}] ${req.originalUrl}`, `[CONTENT] ${error}`);
    console.log(error);
    
    res.status(statusCode.INTERNAL_SERVER_ERROR).send(util.fail(statusCode.INTERNAL_SERVER_ERROR, responseMessage.INTERNAL_SERVER_ERROR));
    
  } finally {
    client.release();
  }
};