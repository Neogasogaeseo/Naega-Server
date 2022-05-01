const functions = require('firebase-functions');
const util = require('../../../lib/util');
const statusCode = require('../../../constants/statusCode');
const responseMessage = require('../../../constants/responseMessage');
const db = require('../../../db/db');
const slackAPI = require('../../../lib/slackAPI');
const { teamDB, feedbackDB } = require('../../../db');
const { NO_FEEDBACK_TO_PICK } = require('../../../constants/responseMessage');

module.exports = async (req, res) => {

  const user = req.user;
  const userId = user.id;
  const {teamId, offset, limit} = req.query;
  
  if (!user || !offset || !limit) return res.status(statusCode.BAD_REQUEST).send(util.fail(statusCode.BAD_REQUEST, responseMessage.NULL_VALUE));
  
  let client;
  
  
  
  try {
    client = await db.connect(req);

    //^_^// 가장 상단에 내가 속해있는 팀 가져오기
    const teamData = await teamDB.getTeamListByUserId(client, userId);

    //^_^// 속한 팀이 없을 경우 204 리턴
    if (!teamData) return res.status(statusCode.NO_CONTENT).send(util.success(statusCode.NO_CONTENT));
 
    let feedbackData;
    if(!teamId) { //^_^// 필터링할 팀아이디가 없는경우 전부 조회
        feedbackData = await feedbackDB.getAllFeedbackByUserId(client, userId, offset, limit);
    } else { //^_^// 팀아이디가 있는 경우 필터링
        feedbackData = await feedbackDB.getFilteredFeedbackByFormId(client, userId, teamId, offset, limit);
    };

    //^_^// 나에게 작성된 피드백이 없는 경우
    if (feedbackData.length === 0) {
        const resultData = {
            team: teamData
        };
        return res.status(statusCode.OK).send(util.success(statusCode.OK, NO_FEEDBACK_TO_PICK, resultData));
    };

    //^_^// 북마크한 피드백 리스트에서 아이디값 가져오기
    const feedbackIdList = pinnedFeedbackList.map((o) => o.feedbackId);
    console.log('feedbackIdList: ', feedbackIdList);

    //^_^// 피드백 아이디값으로 키워드 가져오기
    const keywordList = await keywordDB.getKeywordListByFeedbackId(client, feedbackIdList);
    console.log('keywordList: ', keywordList);

    //^_^// 키워드를 객체 안에 넣기 위한 밑작업
    const feedbackListPopId = pinnedFeedbackList.reduce((acc, cur) => {
      acc[cur.feedbackId] = { ...cur, keywords: [] };
      return acc;
    }, {});

    //^_^//keyword 리스트 안에 객체값 집어넣기
    keywordList.map((o) => {
      feedbackListPopId[o.feedbackId].keywords.push(o);
      console.log(o);
      return o;
    });
    console.log(feedbackListPopId);

    //^_^// key와 value값으로 구분 후 value값만 map함수로 빼내기
    const resultFeedbackData = Object.entries(feedbackListPopId).map(([feedbackId, data]) => ({ ...data }));

    //^_^// 팀과 북마크한 피드백 리스트가 모두 있는 경우 return 데이터
    const resultData = {
      team: teamData,
      feedback: resultFeedbackData,
    };


    res.status(statusCode.OK).send(util.success(statusCode.OK, responseMessage.READ_FILTERED_FEEDBACK_SUCCESS, resultData));
    
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