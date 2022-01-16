const functions = require('firebase-functions');
const util = require('../../../lib/util');
const statusCode = require('../../../constants/statusCode');
const responseMessage = require('../../../constants/responseMessage');
const db = require('../../../db/db');
const slackAPI = require('../../../middlewares/slackAPI');
const { answerDB, formDB, userDB } = require('../../../db');
const { decrypt } = require('../../../middlewares/crypto');
const _ = require('lodash');


module.exports = async (req, res) => {

  const { iv, q } = req.query;

  if (!iv || !q) return res.status(statusCode.BAD_REQUEST).send(util.fail(statusCode.BAD_REQUEST, responseMessage.NULL_VALUE));

  const hash = { iv : iv, q: q};
  const { userId, formId } = decrypt(hash);

  console.log(userId, formId);

  let client;
 
  try {
    client = await db.connect(req);

    const relationshipList = await answerDB.getRelationship(client);

    const formData = await formDB.getForm(client, userId, formId);
    console.log(formData);

    const userDataList = await userDB.getUserById(client, userId);
    const userData = _.pick(userDataList, ['id', 'name']);
    
    const resultData = {
      relationship: relationshipList,
      form: formData,
      user: userData
    };
    
    res.status(statusCode.OK).send(util.success(statusCode.OK, responseMessage.READ_FORM_SUCCESS, resultData ));
    
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