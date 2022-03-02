const functions = require('firebase-functions');
const dayjs = require('dayjs');
const util = require('../../../lib/util');
const arrayHandler = require('../../../lib/arrayHandler');
const statusCode = require('../../../constants/statusCode');
const responseMessage = require('../../../constants/responseMessage');
const db = require('../../../db/db');
const slackAPI = require('../../../middlewares/slackAPI');
const { teamDB, feedbackDB, keywordDB } = require('../../../db');

module.exports = async (req, res) => {
  const { profileId } = req.params;

  if (!profileId) return res.status(statusCode.BAD_REQUEST).send(util.fail(statusCode.BAD_REQUEST, responseMessage.NULL_VALUE));

  let client;

  try {
    client = await db.connect(req);

    //^_^// 속해있는 팀 리스트 가져오기
    const teamList = await teamDB.getTeamListByProfileId(client, profileId);

    //^_^// 북마크한 피드백 리스트 가져오기
    const pinnedFeedbackList = await feedbackDB.getPinnedFeedbackByProfileId(client, profileId);

    //^_^// 북마크한 피드백리스트와 소속된 teamList가 모두 없는 경우 204코드 return
    if (pinnedFeedbackList.length === 0 & teamList.length === 0) return res.status(statusCode.OK).send(util.success(statusCode.NO_CONTENT, responseMessage.NO_TEAM_AND_PINNED_FEEDBACK));

    //^_^// 북마크한 피드백리스트가 없는 경우 teamList만 return 
    if (pinnedFeedbackList.length === 0) return res.status(statusCode.OK).send(util.success(statusCode.OK, responseMessage.NO_PINNED_FEEDBACK, {teamList}));

    //^_^// 날짜 형식 바꿔주기
    for (const feedback of pinnedFeedbackList) {
      feedback.createdAt = dayjs(feedback.createdAt).format('YYYY-MM-DD');
    }
    console.log('pinnedFeedbackList: ', pinnedFeedbackList);

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
    const resultFeedbackList = Object.entries(feedbackListPopId).map(([feedbackId, data]) => ({ ...data }));
    
    //^_^// 팀과 북마크한 피드백 리스트가 모두 있는 경우 return 데이터
    const resultData = {
      teamList,
      pinnedFeedbackList: resultFeedbackList,
    };

    res.status(statusCode.OK).send(util.success(statusCode.OK, responseMessage.READ_TEAM_AND_PINNED_FEEDBACK_SUCCESS, resultData));
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
