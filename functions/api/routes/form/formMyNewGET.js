const functions = require('firebase-functions');
const dayjs = require('dayjs');
const util = require('../../../lib/util');
const statusCode = require('../../../constants/statusCode');
const responseMessage = require('../../../constants/responseMessage');
const db = require('../../../db/db');
const { answerDB, formDB, keywordDB } = require('../../../db');
const resizeImage = require('../../../middlewares/resizeImage');
const lodash = require('lodash');
const slackAPI = require('../../../middlewares/slackAPI');

const extractValues = (arr, key) => {
  if (!Array.isArray(arr)) return [arr[key] || null];
  return [...new Set(arr.map((o) => o[key]).filter(Boolean))];
};

module.exports = async (req, res) => {
  const { id: userId } = req.user;
  if (!userId) return res.status(statusCode.BAD_REQUEST).send(util.fail(statusCode.BAD_REQUEST, responseMessage.NULL_VALUE));

  let client;

  try {
    client = await db.connect(req);

    //^_^// formId 최신순 정렬
    const myFormIdRecentList = await answerDB.getFormIdRecentAnswerListByUserId(client, userId);
    if (myFormIdRecentList.length === 0) {
      return res.status(statusCode.OK).send(util.success(statusCode.OK, responseMessage.NO_MY_FORM_CONTENT));
    }
    const idUnique = myFormIdRecentList.filter((form, index, arr) => {
      return arr.findIndex((item) => item.formId === form.formId) === index;
    });
    let idList = extractValues(idUnique, 'formId');
    const count = idList.length;

    //^_^// form id로 form, answer 정보 가져오기
    const myForm = await formDB.getFormByFormIdList(client, idList, userId);
    for (const form of myForm) {
      form.createdAt = dayjs(form.createdAt).format('YYYY-MM-DD');
      form.darkIconImage = resizeImage(form.darkIconImage);
      form.answer = [];
    }
    const myAnswer = await answerDB.getAnswerByFormIdListAndUserID(client, idList, userId);
    const myAnswerList = myAnswer.reduce((result, answer) => {
      const a = result.find(({ id }) => id === answer.formId);
      a ? a.answer.push(answer) : result.push({ id: answer.formId, answer: [answer] });
      return result;
    }, []);

    //^_^// answer 두개만, answerId 추출해서 keyword 검색, grouping
    const answerIdList = [];
    for (const item of myAnswerList) {
      if (item.answer.length > 2) {
        item.answer = item.answer.slice(0, 2);
      }
      item.answer.forEach((o) => answerIdList.push(o.id));
      item.answer.forEach((o) => (o.keyword = []));
    }
    if (answerIdList.length === 0) {
      const resultList = myForm;
      return res.status(statusCode.OK).send(util.success(statusCode.OK, responseMessage.READ_FORM_SUCCESS, { resultList, count }));
    }

    const myKeywordList = await keywordDB.getKeywordByAnswerId(client, answerIdList);
    const keywordList = myKeywordList.reduce((result, keyword) => {
      const a = result.find(({ id }) => id === keyword.answerId);
      a ? a.keyword.push(keyword) : result.push({ id: keyword.answerId, keyword: keyword ? [keyword] : [] });
      return result;
    }, []);

    //^_^// keyword를 answer에 묶기
    let myAnswerKeywordList = [];
    for (const item of myAnswerList) {
      const kmap = new Map();
      item.answer.forEach((item) => kmap.set(item.id, item));
      keywordList.forEach((item) => kmap.set(item.id, { ...kmap.get(item.id), ...item }));
      myAnswerKeywordList = Array.from(kmap.values());
      for (const item of myAnswerKeywordList) {
        if (item.keyword) {
          for (const keyword of item.keyword) {
            delete keyword.answerId;
          }
        }
      }
      myAnswerKeywordList = myAnswerKeywordList.filter((answer) => answer.formId);
      item.answer = myAnswerKeywordList;
    }

    //^_^// 합치기 완료
    const map = new Map();
    idList.forEach((item) => map.set(item, item));
    myForm.forEach((item) => map.set(item.id, { ...map.get(item.id), ...item }));
    myAnswerList.forEach((item) => map.set(item.id, { ...map.get(item.id), ...item }));
    const resultList = Array.from(map.values());
    for (const item of resultList) {
      if (item.answer) {
        for (const answer of item.answer) {
          delete answer.formId;
        }
      }
    }

    res.status(statusCode.OK).send(util.success(statusCode.OK, responseMessage.READ_FORM_SUCCESS, { resultList, count }));
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
