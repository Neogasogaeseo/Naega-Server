const functions = require('firebase-functions');
const util = require('../../../lib/util');
const statusCode = require('../../../constants/statusCode');
const responseMessage = require('../../../constants/responseMessage');
const db = require('../../../db/db');
const slackAPI = require('../../../lib/slackAPI');
const { answerDB, keywordDB } = require('../../../db');

module.exports = async (req, res) => {
  const { profileId } = req.params;

  if (!profileId) return res.status(statusCode.BAD_REQUEST).send(util.fail(statusCode.BAD_REQUEST, responseMessage.NULL_VALUE));

  let client;

  try {
    client = await db.connect(req);

    //^_^// 북마크된 답변 리스트 가져오기
    const pinnedAnswerList = await answerDB.getPinnedAnswerByProfileId(client, profileId);
    if (pinnedAnswerList.length === 0) return res.status(statusCode.OK).send(util.success(statusCode.NO_CONTENT, responseMessage.NO_PINNED_ANSWER));

    //^_^// 북마크한 피드백 리스트에서 아이디값 가져오기
    const answerIdList = pinnedAnswerList.map((o) => o.answerId);
    console.log('answerIdList: ', answerIdList);

    //^_^// 피드백 아이디값으로 키워드 가져오기
    const keywordList = await keywordDB.getKeywordListByAnswerId(client, answerIdList);
    console.log('keywordList: ', keywordList);
    if (keywordList.length === 0) return res.status(statusCode.OK).send(util.success(statusCode.OK, responseMessage.READ_ALL_PINNED_ANSWER_SUCCESS, pinnedAnswerList));

    //^_^// 키워드를 객체 안에 넣기 위한 밑작업
    const answerListPopId = pinnedAnswerList.reduce((acc, cur) => {
      acc[cur.answerId] = { ...cur, keywords: [] };
      return acc;
    }, {});
    console.log(answerListPopId);

    //^_^//keyword 리스트 안에 객체값 집어넣기
    keywordList.map((o) => {
      answerListPopId[o.answerId].keywords.push(o);
      console.log(o);
      return o;
    });
    console.log(answerListPopId);

    //^_^// key와 value값으로 구분 후 value값만 map함수로 빼내기
    const resultAnswerList = Object.entries(answerListPopId).map(([answerId, data]) => ({ ...data }));
    console.log('result ', resultAnswerList);

    res.status(statusCode.OK).send(util.success(statusCode.OK, responseMessage.READ_ALL_PINNED_ANSWER_SUCCESS, resultAnswerList));
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
