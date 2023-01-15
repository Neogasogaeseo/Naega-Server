const functions = require('firebase-functions');
const util = require('../../../lib/util');
const statusCode = require('../../../constants/statusCode');
const responseMessage = require('../../../constants/responseMessage');
const db = require('../../../db/db');
const slackAPI = require('../../../lib/slackAPI');
const { memberDB, feedbackDB, linkFeedbacKeywordDB, keywordDB, issueDB } = require('../../../db');
const { isFunction } = require('lodash');
const arrayHandler = require('../../../lib/arrayHandler');
const { user } = require('firebase-functions/v1/auth');

module.exports = async (req, res) => {
  const { id: userId } = req.user;
  const { teamId } = req.body;

  if (!userId || !teamId) return res.status(statusCode.BAD_REQUEST).send(util.fail(statusCode.BAD_REQUEST, responseMessage.NULL_VALUE));

  let client;

  try {
    client = await db.connect(req);

    //^_^// 해당 멤버 get
    const isMember = await memberDB.checkMemberTeam(client, userId, teamId);
    if (!isMember) {
      return res.status(statusCode.FORBIDDEN).send(util.success(statusCode.FORBIDDEN, responseMessage.NO_MEMBER));
    }

    //^_^// 해당 멤버가 쓴 이슈 조회 및 아이디 추출
    const userIssueList = await issueDB.getAllIssueIdListByUserIdAndTeamId(client, userId, teamId);
    const userIssueIdList = arrayHandler.extractValues(userIssueList, 'id');

    let userIssueFeedbackIdList = [];
    //^_^// 해당 이슈에 포함되는 피드백 아이디 추출
    if (userIssueIdList.length > 0) {
      const userIssueFeedbackList = await feedbackDB.getAllFeedbackByIssueIdList(client, userIssueIdList);
      userIssueFeedbackIdList = arrayHandler.extractValues(userIssueFeedbackList, 'id');
    }

    //^_^// 해당 팀 멤버가 포함된 또는 쓴 피드백 조회 및 아이디 추출
    const userFeedbackList = await feedbackDB.getAllFeedbackByUserIdAndTeamId(client, userId, teamId);
    const userFeedbackIdList = arrayHandler.extractValues(userFeedbackList, 'feedbackId');

    //^_^// 위의 이슈에 포함된 피드백 아이디 + 해당 멤버가 포함되거나 쓴 피드백 아이디
    const feedbackIdList = [...userIssueFeedbackIdList, ...userFeedbackIdList];

    if (feedbackIdList.length > 0) {
      console.log(2);
      //^_^// 해당 피드백에 포함된 키워드들 추출
      const linkFeedbackKeywords = await linkFeedbacKeywordDB.getKeywordsWithFeedbackIdList(client, feedbackIdList);

      console.log(3);
      //^_^// 삭제한 feedback에 담긴 키워드 삭제
      const keywordIdsBeforeUpdate = arrayHandler.extractValues(linkFeedbackKeywords, 'id');
      if (keywordIdsBeforeUpdate.length > 0) {
        console.log(4);
        const deleteLinkFeedbackKeyword = await linkFeedbacKeywordDB.deleteLinkFeedbackListKeyword(client, feedbackIdList, keywordIdsBeforeUpdate);

        console.log(5);
        //^_^// 삭제한 keyword count-- 업데이트
        const deleteKeywords = await keywordDB.keywordCountDelete(client, keywordIdsBeforeUpdate);
      }
      console.log(6);
      //^_^// 쓴 피드백 삭제
      const deletedFeedbackList = await feedbackDB.deleteFeedbackList(client, feedbackIdList);
    }

    console.log(7);
    //^_^// 해당 멤버가 쓴 이슈 삭제
    if (userIssueIdList.length > 0) {
      console.log(8);
      const deletedIssueList = await issueDB.deleteIssueList(client, userIssueIdList);
    }

    console.log(9);
    //^_^// 해당 멤버 삭제
    const member = await memberDB.deleteMember(client, userId, teamId);
    console.log(10);

    res.status(statusCode.OK).send(util.success(statusCode.OK, responseMessage.DELETE_MEMBER_SUCCESS, { member }));
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
