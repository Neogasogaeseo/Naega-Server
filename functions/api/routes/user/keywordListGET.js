const functions = require('firebase-functions');
const util = require('../../../lib/util');
const statusCode = require('../../../constants/statusCode');
const responseMessage = require('../../../constants/responseMessage');
const db = require('../../../db/db');
const { keywordDB, userDB } = require('../../../db');

module.exports = async (req, res) => {
  const { offset, limit, userId } = req.query;

  if (!offset || !limit || !userId) return res.status(statusCode.BAD_REQUEST).send(util.fail(statusCode.BAD_REQUEST, responseMessage.NULL_VALUE));

  let client;

  try {
    client = await db.connect(req);

    const getKeyword = await keywordDB.getKeywordList(client, userId, offset, limit);

    const getUser = await userDB.getUserById(client, userId);

    const data = { name: getUser.name, keyword: getKeyword };

    res.status(statusCode.OK).send(util.success(statusCode.OK, responseMessage.READ_KEYWORD_SUCCESS, data));
  } catch (error) {
    functions.logger.error(`[ERROR] [${req.method.toUpperCase()}] ${req.originalUrl}`, `[CONTENT] ${error}`);
    console.log(error);

    res.status(statusCode.INTERNAL_SERVER_ERROR).send(util.fail(statusCode.INTERNAL_SERVER_ERROR, responseMessage.INTERNAL_SERVER_ERROR));
  } finally {
    client.release();
  }
};
