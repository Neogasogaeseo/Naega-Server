const functions = require('firebase-functions');
const util = require('../../../lib/util');
const statusCode = require('../../../constants/statusCode');
const responseMessage = require('../../../constants/responseMessage');
const { keywordDB, userDB } = require('../../../db');
const db = require('../../../db/db');
const _ = require('lodash');
const arrayHandler = require('../../../lib/arrayHandler');

const flattenObject = (obj) => {
  const flattened = {};

  Object.keys(obj).forEach((key) => {
    const value = obj[key];

    if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
      Object.assign(flattened, flattenObject(value));
    } else {
      flattened[key] = value;
    }
  });

  return flattened;
};

const copyArray = function (target) {
  let result = [];
  for (const prop in target) {
    result[prop] = target[prop];
  }
  return result;
};

module.exports = async (req, res) => {
  let client;
  try {
    client = await db.connect(req);
    // ^_^// count가 0 이면서 isDeleted 가 false 인 키워드만 쭉 모아온다
    const getKeyword = await keywordDB.getAllKeywordForSet(client);
    // console.log('getKeyword : ', getKeyword);

    // ^_^// 원하는 형태의 값을 얻기 위해 userId와 name 이 두 키 값으로 두번 groupBy 해준다
    const groupedKeyword = _.groupBy(getKeyword, 'userId');
    const regroupedKeyword = _.forEach(groupedKeyword, function (value, key) {
      groupedKeyword[key] = _.groupBy(groupedKeyword[key], 'name');
    });
    // console.log('regroupedKeyword  : ', JSON.stringify(regroupedKeyword, null, 4));

    // ^_^// groupBy 해준걸 flatten하는 작업을 거쳐 2차 배열 형태로 만들어준다
    const flattenedKeyword = Object.values(flattenObject(regroupedKeyword));
    // console.log('flattenedKeyword : ', flattenedKeyword);

    for (const property in flattenedKeyword) {
      /*
       * ^_^// 데이터 정리를 위해 사용할 id 값만 뽑아온다.
       *      -> 여기서 사용할건 오직 0번 id. 나머지 id는 전부 삭제해주고 0번 id에 해당하는 키워드들만 유효하게 만드는 작업이다.
       */

      const extractKeyword = arrayHandler.extractValues(flattenedKeyword[property], 'id');
      console.log('extractKeyword : ', extractKeyword);

      const copiedKeyword = copyArray(extractKeyword);

      // ^_^// id 배열 중 0번 id의 count 값을 업데이트하고
      const updateKeywordCountForSet = await keywordDB.updateKeywordCountForSet(client, extractKeyword[0], extractKeyword.length);
      copiedKeyword.shift();
      // ^_^// 나머지 id들은 삭제 해준다
      const deleteKeywordsForSet = await keywordDB.deleteKeywordsForSet(client, extractKeyword);

      // ^_^// link_answer_keyword, link_feedback_keyword 중에 extractKeyword안에 있는 id가 사용된 row들이 있다면 전부 0번 id로 바꿔준다
      if (copiedKeyword.length != 0) {
        await keywordDB.updateLinkAnswerKeywordsForSet(client, extractKeyword[0], copiedKeyword);
        await keywordDB.updateLinkFeedbackKeywordsForSet(client, extractKeyword[0], copiedKeyword);
      }
    }

    res.status(statusCode.OK).send(util.success(statusCode.OK, '키워드 정리 완료!'));
  } catch (error) {
    console.log(error);
    res.status(statusCode.INTERNAL_SERVER_ERROR).send(util.fail(statusCode.INTERNAL_SERVER_ERROR, responseMessage.INTERNAL_SERVER_ERROR));
  } finally {
    client.release();
  }
};
