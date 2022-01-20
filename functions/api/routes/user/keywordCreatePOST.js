const functions = require('firebase-functions');
const util = require('../../../lib/util');
const statusCode = require('../../../constants/statusCode');
const responseMessage = require('../../../constants/responseMessage');
const db = require('../../../db/db');
const { keywordDB } = require('../../../db');

module.exports = async (req, res) => {
  const { name, userId } = req.body;

  if (!name || !userId) return res.status(statusCode.BAD_REQUEST).send(util.fail(statusCode.BAD_REQUEST, responseMessage.NULL_VALUE));
  let client;

  try {
    client = await db.connect(req);

    const alreadyKeyword = await keywordDB.checkKeyword(client, name, userId);

    if (alreadyKeyword) {
      alreadyKeyword.colorCode = alreadyKeyword.code;
      delete alreadyKeyword.code;

      return res.status(statusCode.OK).send(util.success(statusCode.OK, responseMessage.ALREADY_KEYWORD, alreadyKeyword));
    }

    const colorId = Math.floor(Math.random() * 10);
    const newKeyword = await keywordDB.addKeyword(client, name, userId, colorId);

    console.log('newKeyword :', newKeyword);

    const returnedKeyword = await keywordDB.checkKeyword(client, name, userId);
    returnedKeyword.colorCode = returnedKeyword.code;
    delete returnedKeyword.code;

    console.log('returnedKeyword :', returnedKeyword);

    res.status(statusCode.OK).send(util.success(statusCode.OK, responseMessage.ADD_KEYWORD_SUCCESS, returnedKeyword));
  } catch (error) {
    functions.logger.error(`[ERROR] [${req.method.toUpperCase()}] ${req.originalUrl}`, `[CONTENT] ${error}`);
    console.log(error);

    res.status(statusCode.INTERNAL_SERVER_ERROR).send(util.fail(statusCode.INTERNAL_SERVER_ERROR, responseMessage.INTERNAL_SERVER_ERROR));
  } finally {
    client.release();
  }
};
