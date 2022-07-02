const functions = require('firebase-functions');
const util = require('../../../lib/util');
const statusCode = require('../../../constants/statusCode');
const responseMessage = require('../../../constants/responseMessage');
const db = require('../../../db/db');
const slackAPI = require('../../../lib/slackAPI');
const { formDB } = require('../../../db');
const resizeImage = require('../../../lib/resizeImage');

const extractValues = (arr, key) => {
  if (!Array.isArray(arr)) return [arr[key] || null];
  return [...new Set(arr.map((o) => o[key]).filter(Boolean))];
};

module.exports = async (req, res) => {
  const { id: userId } = req.user;
  let client;

  try {
    client = await db.connect(req);

    const form = await formDB.getAllFormByUserId(client, userId);
    form.forEach((item) => (item.lightIconImage = resizeImage(item.lightIconImage)));
    console.log(form);
    const formIdList = extractValues(form, 'id');
    const isCreated = await formDB.getFormIsCreatedByUserId(client, formIdList, userId);
    const map = new Map();
    form.forEach((item) => map.set(item.id, item));
    isCreated.forEach((item) => map.set(item.id, { ...map.get(item.id), ...item }));
    const data = Array.from(map.values());

    res.status(statusCode.OK).send(util.success(statusCode.OK, responseMessage.READ_ALL_USER_FORM_SUCCESS, data));
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
