const functions = require('firebase-functions');
const util = require('../../../lib/util');
const statusCode = require('../../../constants/statusCode');
const responseMessage = require('../../../constants/responseMessage');
const db = require('../../../db/db');
<<<<<<< HEAD:functions/api/routes/team/teamPOST.js
const { teamDB } = require('../../../db')

module.exports = async (req, res) => {

  const { name, image, description } = req.body
  
  if (!name) return res.status(statusCode.BAD_REQUEST).send(util.fail(statusCode.BAD_REQUEST, responseMessage.NULL_VALUE));
=======

module.exports = async (req, res) => {

  const {} = req.body
  
//   if (!) return res.status(statusCode.BAD_REQUEST).send(util.fail(statusCode.BAD_REQUEST, responseMessage.NULL_VALUE));
>>>>>>> a03c670f1b0dc5ec4dc35ef29023eec9a3a68e65:functions/api/routes/user/keywordCreatePOST.js
  
  let client;
  
  
  
  try {
    client = await db.connect(req);

<<<<<<< HEAD:functions/api/routes/team/teamPOST.js
    const teamData = await teamDB.addTeam(client, name, image, description);
    
    res.status(statusCode.OK).send(util.success(statusCode.OK, responseMessage.POST_TEAM, teamData));
=======
    // const DB데이터 = await 파일이름DB.쿼리문이름(client);
    
    // res.status(statusCode.OK).send(util.success(statusCode.OK, responseMessage.READ_ALL_USERS_SUCCESS, DB데이터));
>>>>>>> a03c670f1b0dc5ec4dc35ef29023eec9a3a68e65:functions/api/routes/user/keywordCreatePOST.js
    
  } catch (error) {
    functions.logger.error(`[ERROR] [${req.method.toUpperCase()}] ${req.originalUrl}`, `[CONTENT] ${error}`);
    console.log(error);
    
    res.status(statusCode.INTERNAL_SERVER_ERROR).send(util.fail(statusCode.INTERNAL_SERVER_ERROR, responseMessage.INTERNAL_SERVER_ERROR));
    
  } finally {
    client.release();
  }
};