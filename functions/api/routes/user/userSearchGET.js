const functions = require('firebase-functions');
const util = require('../../../lib/util');
const statusCode = require('../../../constants/statusCode');
const responseMessage = require('../../../constants/responseMessage');
const db = require('../../../db/db');
const { userDB } = require('../../../db');

module.exports = async (req, res) => {

  const { profileId, teamId } = req.query
  
  if (!profileId) return res.status(statusCode.BAD_REQUEST).send(util.fail(statusCode.BAD_REQUEST, responseMessage.NULL_VALUE));
  
  let client;
  
  
  try {
    client = await db.connect(req);

    const userSearchList = await userDB.getUserListByProfileId(client, profileId, teamId);

    if (userSearchList.length === 0) {
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