const functions = require('firebase-functions');
const util = require('../../../lib/util');
const statusCode = require('../../../constants/statusCode');
const responseMessage = require('../../../constants/responseMessage');
const db = require('../../../db/db');
const slackAPI = require('../../../lib/slackAPI');
const { reportDB } = require('../../../db');
const arrayHandler = require('../../../lib/arrayHandler');
const dayjs = require('dayjs');

module.exports = async (req, res) => {
  const { reportKind } = req.params;
  if (!reportKind) {
    return res.status(statusCode.BAD_REQUEST).send(util.fail(statusCode.BAD_REQUEST, responseMessage.NULL_VALUE));
  }

  let client;

  function checkReportKind(reportKind) {
    let kindId = 0;
    switch (reportKind) {
      case 'customer':
        kindId = 1;
        break;
      case 'team':
        kindId = 2;
        break;
      default:
    }
    return kindId;
  }
  try {
    client = await db.connect(req);

    const reportKindId = checkReportKind(reportKind);
    // ^_^// 가져온 kind로 해당 카테고리 조회
    if (reportKindId === 0) {
      return res.status(statusCode.BAD_REQUEST).send(util.fail(statusCode.BAD_REQUEST, responseMessage.NO_REPORT_CATEGORY));
    }
    const reportCategory = await reportDB.getReportCategory(client, reportKindId);

    return res.status(statusCode.OK).send(util.success(statusCode.OK, responseMessage.READ_REPORT_CATEGORY_SUCCESS, reportCategory));
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
