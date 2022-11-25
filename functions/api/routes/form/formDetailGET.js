const functions = require('firebase-functions');
const util = require('../../../lib/util');
const statusCode = require('../../../constants/statusCode');
const responseMessage = require('../../../constants/responseMessage');
const db = require('../../../db/db');
const slackAPI = require('../../../lib/slackAPI');
const dayjs = require('dayjs');
const arrayHandler = require('../../../lib/arrayHandler');
const { formDB, keywordDB, answerDB, linkAnswerKeywordDB } = require('../../../db');
const { encrypt } = require('../../../lib/crypto');
const _ = require('lodash');

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
    // const topKeyword = await keywordDB.getTopKeyword(client, user.id);

    // ^_^// formId로 해당 폼에 해당하는 모든 answer 가져옴
    const answers = await answerDB.getAnswerByFormIdAndUserIdForFormDetailTopKeyword(client, formId, user.id);
    console.log('answers :', answers);

    // ^_^// 가져온 answers들의 id만 추출
    const answersIds = arrayHandler.extractValues(answers, 'id');
    console.log('answersIds : ', answersIds);

    // ^_^// 추출한 answers들로 키워드들 가져옴
    const linkAnswerKeywords = await linkAnswerKeywordDB.getKeywordsWithAnswerIdListForFormDetail(client, answersIds);
    const topKeywordsForThisForm = _.uniqBy(linkAnswerKeywords, 'id');
    // console.log('linkAnswerKeywords : ', _.uniqBy(linkAnswerKeywords, 'id'));

    const data = {
      form: formDetail,
      q,
      keyword: topKeywordsForThisForm,
    };

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
