const functions = require('firebase-functions');
const util = require('../../../lib/util');
const statusCode = require('../../../constants/statusCode');
const responseMessage = require('../../../constants/responseMessage');
const db = require('../../../db/db');
const { keywordDB, userDB } = require('../../../db');
const slackAPI = require('../../../lib/slackAPI');

module.exports = async (req, res) => {
  const { keywordId } = req.query;

  if (!keywordId) return res.status(statusCode.BAD_REQUEST).send(util.fail(statusCode.BAD_REQUEST, responseMessage.NULL_VALUE));

  let client;

  try {
    client = await db.connect(req);

    const Keyword = await keywordDB.getKeywordById(client, keywordId);
    console.log('Keyword : ', Keyword);
    if (Keyword.count <= 1) {
      const deletedKeyword = await keywordDB.deleteKeywordAndCount(client, keywordId);
      console.log('deletedKeyword : ', deletedKeyword);
    } else {
      const deletedKeyword = await keywordDB.deleteKeywordCount(client, keywordId);
      console.log('deletedKeyword - count: ', deletedKeyword);
    }

    res.status(statusCode.OK).send(util.success(statusCode.OK, responseMessage.CANCLE_KEYWORD_SUCCESS));
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
