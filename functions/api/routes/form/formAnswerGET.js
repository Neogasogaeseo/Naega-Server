const functions = require('firebase-functions');
const util = require('../../../lib/util');
const statusCode = require('../../../constants/statusCode');
const responseMessage = require('../../../constants/responseMessage');
const db = require('../../../db/db');
const slackAPI = require('../../../lib/slackAPI');
const { answerDB, formDB } = require('../../../db');
const { decrypt } = require('../../../lib/crypto');
const _ = require('lodash');

module.exports = async (req, res) => {
  const { q } = req.query;

  if (!q) return res.status(statusCode.BAD_REQUEST).send(util.fail(statusCode.BAD_REQUEST, responseMessage.NULL_VALUE));

  const { userId, formId } = decrypt(q);

  let client;

  try {
    client = await db.connect(req);

    //^_^// 유저 정보, 폼 정보 가져오기
    const formData = await formDB.getCreatedFormByUserIdAndFormId(client, userId, formId);

    //^_^// 생성된 폼이 없는 경우
    if (!formData) return res.status(statusCode.NOT_FOUND).send(util.fail(statusCode.NOT_FOUND, responseMessage.NO_FORM));

    //^_^// 관계 데이터 가져오기
    const relationshipData = await answerDB.getRelationship(client);

    //^_^// 총 답변자 수 가져오기
    const answerCountData = await answerDB.getAnswerCount(client, formData.linkUserFormId);

    const resultData = {
      user: {
        id: formData.userId,
        name: formData.name,
        image: formData.image,
      },
      answerCount: answerCountData.answerCount,
      form: {
        linkFormId: formData.linkUserFormId,
        formId: formData.form_id,
        title: formData.title,
        subtitle: formData.subtitle,
        darkIconImage: formData.darkIconImage,
        createdAt: formData.createdAt,
      },
      relationship: relationshipData,
    };

    res.status(statusCode.OK).send(util.success(statusCode.OK, responseMessage.READ_FORM_SUCCESS, resultData));
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
