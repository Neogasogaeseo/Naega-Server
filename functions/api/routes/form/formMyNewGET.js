const functions = require('firebase-functions');
const dayjs = require('dayjs');
const util = require('../../../lib/util');
const statusCode = require('../../../constants/statusCode');
const responseMessage = require('../../../constants/responseMessage');
const db = require('../../../db/db');
const { answerDB, formDB, keywordDB } = require('../../../db');
const resizeImage = require('../../../middlewares/resizeImage');
const { times, remove } = require('lodash');

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
      client.release();
      return res.status(statusCode.OK).send(util.success(statusCode.OK, responseMessage.NO_MY_FORM_CONTENT));
    }
    const idUnique = myFormIdRecentList.filter((form, index, arr) => {
      return arr.findIndex((item) => item.formId === form.formId) === index;
    });
    let idList = extractValues(idUnique, 'formId');

    //^_^// form id로 form, answer 정보 가져오기
    const myForm = await formDB.getFormByFormIdList(client, idList, userId);
    for (const form of myForm) {
      form.createdAt = dayjs(form.createdAt).format('YYYY-MM-DD');
    }

    const myAnswer = await answerDB.getAnswerByFormIdList(client, idList);
    const myAnswerList = myAnswer.reduce((result, answer) => {
      const a = result.find(({ id }) => id === answer.id);
      a ? a.answer.push(answer) : result.push({ id: answer.id, answer: [answer] });
      return result;
    }, []);

    //^_^// answer 두개만, answerId 추출해서 keyword 검색, grouping
    const answerIdList = [];
    for (const item of myAnswerList) {
      if (item.answer.length > 2) {
        item.answer = item.answer.slice(0, 2);
      }
      item.answer.forEach((o) => answerIdList.push(o.answerId));
    }
    if (answerIdList.length === 0) {
      client.release();
      return res.status(statusCode.OK).send(util.success(statusCode.OK, responseMessage.READ_FORM_SUCCESS));
    }
    const myKeywordList = await keywordDB.getKeywordByAnswerId(client, answerIdList);
    const keywordList = myKeywordList.reduce((result, keyword) => {
      const a = result.find(({ id }) => id === keyword.id);
      a ? a.keyword.push(keyword) : result.push({ id: keyword.id, keyword: [keyword] });
      return result;
    }, []);

    //^_^// keyword를 answer에 묶기
    let myAnswerKeywordList = [];
    for (const item of myAnswerList) {
      const kmap = new Map();
      item.answer.forEach((item) => kmap.set(item.answerId, item));
      keywordList.forEach((item) => kmap.set(item.id, { ...kmap.get(item.id), ...item }));
      myAnswerKeywordList = Array.from(kmap.values());
      myAnswerKeywordList = myAnswerKeywordList.filter((answer) => answer.answerId);
      item.answer = myAnswerKeywordList;
    }

    //^_^// 합치기 완료
    const map = new Map();
    idList.forEach((item) => map.set(item, item));
    myForm.forEach((item) => map.set(item.id, { ...map.get(item.id), ...item }));
    myAnswerList.forEach((item) => map.set(item.id, { ...map.get(item.id), ...item }));
    const resultList = Array.from(map.values());

    res.status(statusCode.OK).send(util.success(statusCode.OK, responseMessage.READ_FORM_SUCCESS, resultList));
  } catch (error) {
    functions.logger.error(`[ERROR] [${req.method.toUpperCase()}] ${req.originalUrl}`, `[CONTENT] ${error}`);
    console.log(error);

    res.status(statusCode.INTERNAL_SERVER_ERROR).send(util.fail(statusCode.INTERNAL_SERVER_ERROR, responseMessage.INTERNAL_SERVER_ERROR));
  } finally {
    client.release();
  }
};
