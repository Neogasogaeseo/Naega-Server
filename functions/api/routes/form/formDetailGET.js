const functions = require('firebase-functions');
const util = require('../../../lib/util');
const statusCode = require('../../../constants/statusCode');
const responseMessage = require('../../../constants/responseMessage');
const db = require('../../../db/db');
const slackAPI = require('../../../lib/slackAPI');
const dayjs = require('dayjs');
const { formDB, keywordDB } = require('../../../db');
const { encrypt } = require('../../../lib/crypto');

module.exports = async (req, res) => {
  const user = req.user;
  const { formId } = req.params;

  if (!formId) {
    return res.status(statusCode.BAD_REQUEST).send(util.fail(statusCode.BAD_REQUEST, responseMessage.NULL_VALUE));
  }
  let client;

  try {
    client = await db.connect(req);
    // ^_^// 폼 디테일 조회
    const formDetail = await formDB.getFormDetail(client, formId, user.id);
    if (!formDetail) {
      return res.status(statusCode.OK).send(util.success(statusCode.OK, responseMessage.NO_FORM));
    }
    formDetail.createdAt = dayjs(formDetail.createdAt).format('YYYY-MM-DD');

    // ^_^// 링크 복사용 해쉬
    const q = await encrypt(user.id, formId);

    // ^_^// count 내림차순 keyword 조회
    const topKeyword = await keywordDB.getTopKeyword(client, user.id);

    const data = { ...formDetail, q, keyword: topKeyword };

    return res.status(statusCode.OK).send(util.success(statusCode.OK, responseMessage.READ_FORM_DETAIL_SUCCESS, data));
  } catch (error) {
    functions.logger.error(`[ERROR] [${req.method.toUpperCase()}] ${req.originalUrl}`, `[CONTENT] ${error}`);
    console.log(error);

    const slackMessage = `[ERROR] [${req.method.toUpperCase()}] ${req.originalUrl} ${req.user ? `uid:${req.user.id}` : 'req.user 없음'}
 ${JSON.stringify(error)}`;
    slackAPI.sendMessageToSlack(slackMessage, slackAPI.DEV_WEB_HOOK_ERROR_MONITORING);
    return res.status(statusCode.INTERNAL_SERVER_ERROR).send(util.fail(statusCode.INTERNAL_SERVER_ERROR, responseMessage.INTERNAL_SERVER_ERROR));
  } finally {
    client.release();
  }
};
