const functions = require('firebase-functions');
const util = require('../../../lib/util');
const statusCode = require('../../../constants/statusCode');
const responseMessage = require('../../../constants/responseMessage');
const db = require('../../../db/db');
const { teamDB, memberDB } = require('../../../db');
const slackAPI = require('../../../lib/slackAPI');

module.exports = async (req, res) => {
  const { id: userId } = req.user;
  const { teamId } = req.params;
  const { teamName, image, description } = req.body;
  const imageUrls = req.imageUrls;

  if (!userId || !teamId || !teamName) return res.status(statusCode.BAD_REQUEST).send(util.fail(statusCode.BAD_REQUEST, responseMessage.NULL_VALUE));

  let client;

  try {
    client = await db.connect(req);

    const checkUser = await memberDB.checkMemberHost(client, userId, teamId);
    if (!checkUser) {
      //^_^// is_host가 false인 경우 수정하지 못하도록 함
      return res.status(statusCode.FORBIDDEN).send(util.fail(statusCode.FORBIDDEN, responseMessage.NO_AUTH_MEMBER));
    }

    /**오늘의 한마디...
     * 이미지 파일 업데이트 하는 경우: image=undefined, imageUrls에는 이미지 들어가있음
     * 이미지 파일 변화 없는 경우: image=undefined, imageUrls=undefined
     * 이미지 파일 삭제하는 경우: image="", imageUrls=undefined
     */

    let teamData;
    //^_^// 팀 수정 후 teamData에 결과값 담아오기
    if (image === undefined) {
      if (imageUrls === undefined) { //^_^// 이미지 변화 없는 경우
        teamData = await teamDB.updateTeamWithoutImage(client, teamId, teamName, description);
      } else { //^_^// 이미지 파일 업데이트 하는 경우
        teamData = await teamDB.updateTeamIncludeImage(client, teamId, teamName, description, imageUrls);
      };
    } else {
      if (image.replace(" ","") === "") { //^_^// 공백 제거했을 때 빈문자열인 경우 (삭제하는 경우)
        const nullImage = null;
        teamData = await teamDB.updateTeamIncludeImage(client, teamId, teamName, description, nullImage);
      };
    };
    
    //^_^// image 값이 잘못되었을 경우
    if (teamData === undefined) return res.status(statusCode.BAD_REQUEST).send(util.fail(statusCode.BAD_REQUEST, responseMessage.WRONG_IMAGE));

    const resultData = {
      team: {
        id: teamData.id,
        name: teamData.name,
        image: teamData.image,
        description: teamData.description
      },
    };

    res.status(statusCode.OK).send(util.success(statusCode.OK, responseMessage.UPDATE_TEAM, resultData));
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
