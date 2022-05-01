const functions = require('firebase-functions');
const util = require('../../../lib/util');
const statusCode = require('../../../constants/statusCode');
const responseMessage = require('../../../constants/responseMessage');
const db = require('../../../db/db');
const slackAPI = require('../../../lib/slackAPI');
const { answerDB, formDB, keywordDB } = require('../../../db');

module.exports = async (req, res) => {

  const user = req.user;
  const userId = user.id;
  const {formId, offset, limit} = req.query;
  
  if (!user || !offset || !limit) return res.status(statusCode.BAD_REQUEST).send(util.fail(statusCode.BAD_REQUEST, responseMessage.NULL_VALUE));
  
  let client;
  
  
  
  try {
    client = await db.connect(req);

    //^_^// 가장 상단에 필터링을 위한 생성된 폼 정보 가져오기
    const formData = await formDB.getCreatedFormListByUserId(client, userId);

    let answerData;
    if (!formId) { //^_^// 필터링할 폼아이디가 없을 경우 전부 가져오기
      answerData = await answerDB.getAllAnswerByUserId(client, userId, offset, limit);
    } else { //^_^// 필터링할 폼아이디가 있을 경우, 필터링한 답변만 가져오기
      answerData = await answerDB.getFilteredAnswerByFormId(client, userId, formId, offset, limit);
    }
    //^_^// 조회값이 없을 경우 statuscode 204
    if (!answerData) return res.status(statusCode.NO_CONTENT).send(util.success(statusCode.NO_CONTENT));


    //^_^// 각 답변의 키워드 조회를 위한 answerId 뽑아오기
    const answerIdList = answerData.map((o) => o.answerId);

    //^_^// 키워드 리스트 가져오기
    const keywordList = await keywordDB.getKeywordListByAnswerId(client, answerIdList);

    //^_^// 키워드를 객체 안에 넣기 위한 밑작업
    const answerListPopId = answerData.reduce((acc, cur) => {
      acc[cur.answerId] = { ...cur, keywords: [] };
      return acc;
    }, {});

    //^_^//keyword 리스트 안에 객체값 집어넣기
    keywordList.map((o) => {
      answerListPopId[o.answerId].keywords.push(o);
      return o;
    });

    //^_^// key와 value값으로 구분 후 value값만 map함수로 빼내기
    const resultAnswerData = Object.entries(answerListPopId).map(([answerId, data]) => ({ ...data }));

    const resultData = {
      form: formData,
      answer:resultAnswerData
    }

    res.status(statusCode.OK).send(util.success(statusCode.OK, responseMessage.READ_FILTERED_FORM_SUCCESS, resultData));
    
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