const functions = require('firebase-functions');
const util = require('../../../lib/util');
const statusCode = require('../../../constants/statusCode');
const responseMessage = require('../../../constants/responseMessage');
const db = require('../../../db/db');
const slackAPI = require('../../../lib/slackAPI');
const { userDB, memberDB, issueDB, feedbackDB, linkFeedbacKeywordDB, keywordDB, answerDB, linkAnswerKeywordDB } = require('../../../db');
const arrayHandler = require('../../../lib/arrayHandler');

/**
 * 아래의 내용들을 차례로 처리한다
 * 1. 팀 멤버 삭제
 * - 해당 유저가 포함된 팀에서 멤버 삭제.
 * - 해당 유저가 쓴 피드백/ 포함 된 피드백 삭제.
 * - 해당 피드백에 포함된 키워드들 삭제(link 테이블, 키워드 테이블에서 삭제).
 *
 * 2. 이슈 삭제
 * - 해당 유저가 작성한 이슈 전부 삭제,
 * - 해당 이슈에 연관 피드백 전부 삭제,
 * - 해당 피드백에 포함된 키워드들도 삭제(link 테이블에서만 삭제 + count --해줘야함),
 *
 * 3. 너소서 폼 삭제
 * - 링크 폼 유저 테이블에서 해당 유저 정보 전부 삭제,
 * - 해당 유저가 받은 답변 전부 삭제, 키워드 삭제(link 테이블, 키워드 테이블에서 삭제)
 *
 * 4. 유저 삭제
 * - 유저 테이블에서 해당 유저를 삭제.
 */

module.exports = async (req, res) => {
  const { id: userId } = req.user;
  if (!userId) return res.status(statusCode.BAD_REQUEST).send(util.fail(statusCode.BAD_REQUEST, responseMessage.NULL_VALUE));
  let client;

  try {
    client = await db.connect(req);
    await client.query('BEGIN');

    /** 팀 멤버 삭제 및 이슈 삭제
     * 상단의 1,2번을 합쳐서 처리
     *
     * 1. 해당 유저가 있는 팀 전부 조회
     * 2. 해당 유저가 팀에서 작성한 이슈 전부 조회
     * 3. 해당 유저가 생성한 이슈에 해당하는 피드백 조회
     * 4. 해당 유저가 팀에서 쓴 피드백/ 포함된 피드백 조회
     * 5. 3,4번에서 조회한 피드백에 포함된 키워드들 삭제(link 테이블, 키워드 테이블에서 삭제).
     * 6. 3,4번에서 조회한 피드백들 전부 삭제
     * 7. 해당 유저가 작성한 이슈 전부 삭제
     * 8. 해당 유저가 속한 모든 팀에서 해당 유저 멤버 삭제
     * */

    //^_^// 해당 유저가 포함된 팀 id 추출
    const teamIds = await memberDB.getAllTeamIdsByUserId(client, userId);
    //^_^// 해당 유저가 포함된 팀에서 해당 유저가 생성한 issue id 추출
    const issueIds = await issueDB.getAllIssueIdsByUserIdAndTeamIds(client, userId, teamIds);
    //^_^// 유저가 생성한 issue에 포함되는 피드백 아이디 추출
    let userIssueFeedbackIds = await feedbackDB.getAllFeedbackByIssueIdList(client, issueIds);
    userIssueFeedbackIds = arrayHandler.extractValues(userIssueFeedbackIds, 'id');
    //^_^// 해당 팀 멤버가 포함된 또는 쓴 피드백 조회 및 아이디 추출
    const userFeedbackIds = await feedbackDB.getAllFeedbackByUserIdAndTeamIds(client, userId, teamIds);
    //^_^// 위의 이슈에 포함된 피드백 아이디 + 해당 멤버가 포함되거나 쓴 피드백 아이디
    const feedbackIdList = [...userIssueFeedbackIds, ...userFeedbackIds];

    if (feedbackIdList.length > 0) {
      //^_^// 해당 피드백에 포함된 키워드들 추출
      const linkFeedbackKeywords = await linkFeedbacKeywordDB.getKeywordsWithFeedbackIdList(client, feedbackIdList);
      // console.log('linkFeedbackKeywords', linkFeedbackKeywords);
      const keywordIdsBeforeUpdate = arrayHandler.extractValues(linkFeedbackKeywords, 'id');
      // console.log('keywordIdsBeforeUpdate', keywordIdsBeforeUpdate);

      //^_^// 삭제한 feedback에 담긴 키워드 삭제
      await linkFeedbacKeywordDB.deleteLinkFeedbackListKeyword(client, feedbackIdList, keywordIdsBeforeUpdate);
      //^_^// 삭제한 keyword count-- 업데이트
      await keywordDB.keywordCountDelete(client, keywordIdsBeforeUpdate);
      // ^_^// 쓴 피드백 삭제
      await feedbackDB.deleteFeedbackList(client, feedbackIdList);
    }
    //^_^// 해당 멤버가 쓴 이슈 삭제
    if (issueIds.length > 0) {
      await issueDB.deleteIssueList(client, issueIds);
    }
    //^_^// 모든 팀에서 멤버 삭제
    await memberDB.deleteMembersFromAllTeam(client, userId, teamIds);

    /** 너소서 폼 삭제
     *
     * 1. 해당 유저가 생성한 폼 전부 조회 (링크 폼 유저 테이블)
     * 2. 해당 유저가 폼에서 받은 답변 전부 조회
     * 3. 조회한 답변에 포함된 키워드들 삭제(link 테이블, 키워드 테이블에서 삭제)
     * 4. 해당 유저가 폼에서 받은 답변 전부 삭제
     * 5. 해당 유저가 작성한 폼 전부 삭제
     * */

    //^_^// 해당 유저가 생성한 폼 전부 조회하여 유저가 생성한 폼 id 추출 (link_form_user 테이블)
    const createdFormIds = await answerDB.getAllCreatedFormIdsByUserId(client, userId);
    //^_^// 해당 유저가 생성한 폼에 달린 답변 id 추출
    const allAnswers = await answerDB.getAllAnswerByUserId(client, userId);
    const answerIds = arrayHandler.extractValues(allAnswers, 'answerId');

    if (answerIds.length > 0) {
      //^_^// 해당 피드백에 포함된 키워드들 id 추출
      const linkAnswerKeywords = await linkAnswerKeywordDB.getKeywordsWithAnswerIdList(client, answerIds);
      const keywordIdsBeforeUpdate = arrayHandler.extractValues(linkAnswerKeywords, 'id');
      //^_^// 삭제한 답변에 담긴 키워드 삭제
      await linkAnswerKeywordDB.deleteLinkAnswerKeyword(client, answerIds, keywordIdsBeforeUpdate);
      //^_^// 삭제한 keyword count-- 업데이트
      await keywordDB.keywordCountDelete(client, keywordIdsBeforeUpdate);
      // ^_^// 답변 삭제
      await answerDB.deleteAnswer(client, answerIds);
    }
    // 유저가 생성한 폼 삭제
    await answerDB.deleteUserLinkForm(client, createdFormIds);

    // 유저 삭제!
    await userDB.deleteUser(client, userId);

    await client.query('COMMIT');
    res.status(statusCode.OK).send(util.success(statusCode.OK, responseMessage.DELETE_USER_SUCCESS));
  } catch (error) {
    await client.query('ROLLBACK');
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
