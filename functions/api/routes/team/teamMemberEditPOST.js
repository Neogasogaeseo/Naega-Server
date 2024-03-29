const functions = require('firebase-functions');
const util = require('../../../lib/util');
const statusCode = require('../../../constants/statusCode');
const responseMessage = require('../../../constants/responseMessage');
const db = require('../../../db/db');
const slackAPI = require('../../../lib/slackAPI');
const { memberDB } = require('../../../db');


const extractValues = (arr, key) => {
  if (!Array.isArray(arr)) return [arr[key] || null];
  return [...new Set(arr.map((o) => o[key]).filter(Boolean))];
};

module.exports = async (req, res) => {
  const user = req.user;
  const { teamId, userIdList } = req.body;


  if (!user || !teamId || userIdList === 0) return res.status(statusCode.BAD_REQUEST).send(util.fail(statusCode.BAD_REQUEST, responseMessage.NULL_VALUE));

  let client;

  try {
    client = await db.connect(req);

    const checkUser = await memberDB.checkMemberHost(client, user.id, teamId);
    if (!checkUser) {
      //^_^// is_host가 false인 경우 수정하지 못하도록 함
      return res.status(statusCode.FORBIDDEN).send(util.fail(statusCode.FORBIDDEN, responseMessage.NO_AUTH_MEMBER));
    }

    //^_^// userIdList 중복 제거
    const uniqueUserIdList = [...new Set(JSON.parse(userIdList))];

    //^_^// 이미 초대가 날라갔는지 확인
    const duplicateMember = await memberDB.checkDuplicateMember(client, teamId, uniqueUserIdList);

    const duplicateMemberUserId = extractValues(duplicateMember, 'userId');

    const uniqueDuplicateMember = [...new Set(duplicateMemberUserId)];

    const notInvitedUserId = uniqueUserIdList.filter((x) => x != uniqueDuplicateMember);

    //^_^// 새로운 유저 멤버로 추가
    const newMemberData = await memberDB.addMember(client, teamId, notInvitedUserId);

    const resultData = {
      member: newMemberData,
    };

    res.status(statusCode.OK).send(util.success(statusCode.OK, responseMessage.POST_MEMBER, resultData));
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
