const functions = require('firebase-functions');
const util = require('../../../lib/util');
const statusCode = require('../../../constants/statusCode');
const responseMessage = require('../../../constants/responseMessage');
const db = require('../../../db/db');
const { userDB } = require('../../../db');
const slackAPI = require('../../../lib/slackAPI');

module.exports = async (req, res) => {
  const { id: userId } = req.user;
  const { profileId, teamId, limit, offset, } = req.query;

  if (!profileId || !limit || !offset) return res.status(statusCode.BAD_REQUEST).send(util.fail(statusCode.BAD_REQUEST, responseMessage.NULL_VALUE));

  let client;

  try {
    client = await db.connect(req);

    let userSearchList;

    if (!teamId) {
      //^_^// 팀 첫 등록할 때 (teamId 없음)
      userSearchList = await userDB.getUserListByOnlyProfileId(client, profileId, userId, offset, limit);
    } else {
      //^_^// 팀 수정에서 검색할 때
      userSearchList = await userDB.getUserListByProfileIdTeamId(client, profileId, userId, teamId, offset, limit);
    };

    if (userSearchList.length === 0) {
      //^_^// 유저 검색 결과가 없을 때 204
      return res.status(statusCode.NO_CONTENT).send(util.success(statusCode.NO_CONTENT, responseMessage.NO_USER_SEARCH_LIST));
    } else {
      const resultData = {
        user: userSearchList
      };
      res.status(statusCode.OK).send(util.success(statusCode.OK, responseMessage.READ_USER_LIST_SUCCESS, resultData));
    }
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
