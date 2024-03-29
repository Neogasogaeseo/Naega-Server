const functions = require('firebase-functions');
const util = require('../../../lib/util');
const statusCode = require('../../../constants/statusCode');
const responseMessage = require('../../../constants/responseMessage');
const db = require('../../../db/db');
const { keywordDB, userDB } = require('../../../db');
const slackAPI = require('../../../lib/slackAPI');

module.exports = async (req, res) => {
  const { name, userId } = req.body;

  if (!name || !userId) return res.status(statusCode.BAD_REQUEST).send(util.fail(statusCode.BAD_REQUEST, responseMessage.NULL_VALUE));
  let client;

  try {
    client = await db.connect(req);

    const checkUser = await userDB.getUserById(client, userId);

    if (!checkUser) {
      return res.status(statusCode.BAD_REQUEST).send(util.fail(statusCode.BAD_REQUEST, responseMessage.NO_USER));
    }

    let newKeyword;
    // ^_^// 이미 존재하는 키워드인지 검색한뒤

    const alreadyKeyword = await keywordDB.checkKeyword(client, name, userId);
    // console.log('alreadyKeyword', alreadyKeyword);

    if (alreadyKeyword) {
      // ^_^// 이미 존재한다면 해당 키워드의 count를 + 해준다

      newKeyword = await keywordDB.addKeyword(client, alreadyKeyword.id);
      // console.log('oldNewKeyword : ', newKeyword);
    } else {
      // ^_^// 존재하지 않는 키워드라면 키워드를 생성해준다

      const colorId = Math.floor(Math.random() * 4) + 1;
      newKeyword = await keywordDB.addNewKeyword(client, name, userId, colorId);
      // console.log('realNewKeyword :', newKeyword);
    }
    res.status(statusCode.OK).send(util.success(statusCode.OK, responseMessage.ADD_KEYWORD_SUCCESS, newKeyword));
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
