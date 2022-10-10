const functions = require('firebase-functions');
const util = require('../../../lib/util');
const statusCode = require('../../../constants/statusCode');
const responseMessage = require('../../../constants/responseMessage');
const db = require('../../../db/db');
const slackAPI = require('../../../lib/slackAPI');
const { userDB } = require('../../../db');

module.exports = async (req, res) => {
  const { id: userId } = req.user;

  if (!userId) return res.status(statusCode.BAD_REQUEST).send(util.fail(statusCode.BAD_REQUEST, responseMessage.NULL_VALUE));

  let client;

  try {
    client = await db.connect(req);
    await client.query('BEGIN');

    /**
     * 아래의 내용들을 차례로 처리한다
     * 1. 팀 멤버 삭제
     * - 해당 유저가 포함된 팀에서 멤버 삭제.
     * - 해당 유저가 쓴 피드백/ 포함 된 피드백 삭제.
     * - 해당 피드백에 포함된 키워드들 삭제(link 테이블, 키워드 테이블에서 삭제).
     *  teamHostPUT teamMemberDELETE 참고
     *
     * 2. 이슈 삭제
     * - 해당 유저가 작성한 이슈 전부 삭제,
     * - 해당 이슈에 연관 피드백 전부 삭제,
     * - 해당 피드백에 포함된 키워드들도 삭제(link 테이블에서만 삭제 + count --해줘야함),
     *
     * 3. 너소서 폼 삭제.
     * - 링크 폼 유저 테이블에서 해당 유저 정보 전부 삭제,
     * - 해당 유저가 받은 답변 전부 삭제, 키워드 삭제(link 테이블, 키워드 테이블에서 삭제)
     * - 해당 유저를 delete 처리
     */
    // const user = await userDB.deleteUser(client, userId);

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
