const functions = require('firebase-functions');
const util = require('../../../lib/util');
const statusCode = require('../../../constants/statusCode');
const responseMessage = require('../../../constants/responseMessage');
const db = require('../../../db/db');
const { userDB } = require('../../../db');

module.exports = async (req, res) => {

  const { id: userId } = req.user;
  const { profileId, teamId } = req.query
  
  if (!profileId) return res.status(statusCode.BAD_REQUEST).send(util.fail(statusCode.BAD_REQUEST, responseMessage.NULL_VALUE));
  
  let client;
  
  
  try {
    client = await db.connect(req);

    let userSearchList;
    if (!teamId) {
      userSearchList = await userDB.getUserListByOnlyProfileId(client, profileId, userId);
    } else {
      userSearchList = await userDB.getUserListByProfileIdTeamId(client, profileId, teamId);
    };

    if (!userSearchList) {
        return res.status(statusCode.OK).send(util.success(statusCode.NO_CONTENT, responseMessage.NO_USER_SEARCH_LIST, []));
    } else {
        res.status(statusCode.OK).send(util.success(statusCode.OK, responseMessage.READ_USER_LIST_SUCCESS, userSearchList));
    };
  } catch (error) {
    functions.logger.error(`[ERROR] [${req.method.toUpperCase()}] ${req.originalUrl}`, `[CONTENT] ${error}`);
    console.log(error);
    
    res.status(statusCode.INTERNAL_SERVER_ERROR).send(util.fail(statusCode.INTERNAL_SERVER_ERROR, responseMessage.INTERNAL_SERVER_ERROR));
    
  } finally {
    client.release();
  }
};