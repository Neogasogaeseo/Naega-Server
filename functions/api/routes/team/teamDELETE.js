const functions = require('firebase-functions');
const util = require('../../../lib/util');
const statusCode = require('../../../constants/statusCode');
const responseMessage = require('../../../constants/responseMessage');
const db = require('../../../db/db');
const slackAPI = require('../../../lib/slackAPI');
const { teamDB, memberDB, feedbackDB, linkFeedbacKeywordDB, keywordDB, issueDB } = require('../../../db');
const arrayHandler = require('../../../lib/arrayHandler');

module.exports = async (req, res) => {
  const { id: userId } = req.user;
  const { teamId } = req.body;

  if (!userId || !teamId) return res.status(statusCode.BAD_REQUEST).send(util.fail(statusCode.BAD_REQUEST, responseMessage.NULL_VALUE));

  let client;

  try {
    client = await db.connect(req);

    //^_^// 팀 삭제 권한 여부 검사
    const teamHost = await teamDB.getIsHost(client, userId, teamId);
    if (!teamHost.isHost) {
      res.status(statusCode.FORBIDDEN).send(util.success(statusCode.FORBIDDEN, responseMessage.NO_AUTH_MEMBER));
    }

    //^_^// 해당 팀에 포함된 이슈 조회 및 아이디 추출
    const teamIssueList = await issueDB.getIssueIdRecentListByTeamId(client, teamId);
    const teamIssueIdList = arrayHandler.extractValues(teamIssueList, 'id');

    //^_^// 해당 이슈에 포함된 피드백 아이디 추출
    const userIssueFeedbackList = await feedbackDB.getAllFeedbackByIssueIdList(client, teamIssueIdList);
    const feedbackIdList = arrayHandler.extractValues(userIssueFeedbackList, 'id');

    if (feedbackIdList.length > 0) {
      //^_^// 해당 피드백에 포함된 키워드들 추출
      const linkFeedbackKeywords = await linkFeedbacKeywordDB.getKeywordsWithFeedbackIdList(client, feedbackIdList);

      //^_^// 삭제한 feedback에 담긴 키워드 삭제
      const keywordIdsBeforeUpdate = arrayHandler.extractValues(linkFeedbackKeywords, 'id');
      const deleteLinkFeedbackKeyword = await linkFeedbacKeywordDB.deleteLinkFeedbackListKeyword(client, feedbackIdList, keywordIdsBeforeUpdate);

      //^_^// 삭제한 keyword count-- 업데이트
      const deleteKeywords = await keywordDB.keywordCountDelete(client, keywordIdsBeforeUpdate);

      //^_^// 쓴 피드백 삭제
      const deletedFeedbackList = await feedbackDB.deleteFeedbackList(client, feedbackIdList);
    }

    //^_^// 해당 팀에 포함된 이슈 삭제
    if (teamIssueIdList.length > 0) {
      const deletedIssueList = await issueDB.deleteIssueList(client, teamIssueIdList);
    }

    //^_^// 해당 팀에 포함된 멤버들 전부 삭제
    const deletedMemberList = await memberDB.deleteAllMemberByTeamId(client, teamId);

    //^_^// 팀 삭제
    const team = await teamDB.deleteTeam(client, teamId);
    res.status(statusCode.OK).send(util.success(statusCode.OK, responseMessage.DELETE_TEAM_SUCCESS, { team }));
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
