const functions = require('firebase-functions');
const util = require('../../../lib/util');
const statusCode = require('../../../constants/statusCode');
const responseMessage = require('../../../constants/responseMessage');
const db = require('../../../db/db');
const { userDB } = require('../../../db');
const slackAPI = require('../../../lib/slackAPI');

module.exports = async (req, res) => {
 
  const { id: userId } = req.user;
  const { profileId, name, image } = req.body;
  const imageUrls = req.imageUrls;
  
  if (!userId || !profileId || !name) return res.status(statusCode.BAD_REQUEST).send(util.fail(statusCode.BAD_REQUEST, responseMessage.NULL_VALUE));
  let client;
  
  
  
  try {
    client = await db.connect(req);

    const checkDuplicate = await userDB.checkUserProfileId(client, profileId);
    
    //^_^// 중복된 다른 유저의 아이디가 존재하는 경우 
    if (checkDuplicate) {
      if (checkDuplicate.id != userId) return res.status(statusCode.BAD_REQUEST).send(util.fail(statusCode.BAD_REQUEST, responseMessage.DUPLICATE_USER_PROFILE_ID));
    };

    let userData;
    //^_^// 프로필 수정 후 userData에 결과값 담아오기
    if (image === undefined) {
      if (imageUrls === undefined) { //^_^// 이미지 변화 없는 경우
        userData = await userDB.updateUserInformationWithoutImage(client, userId, profileId, name);
      } else { //^_^// 이미지 파일 업데이트 하는 경우
        userData = await userDB.updateUserInformationIncludeImage(client, userId, profileId, name, imageUrls); 
      };
    } else { //^_^// 공백 제거했을 때 빈문자열인 경우 (삭제하는 경우)
      const nullImage = null;
      userData = await userDB.updateUserInformationIncludeImage(client, userId, profileId, name, nullImage);
    };

    //^_^// image 값이 잘못되었을 경우
    if (userData === undefined) return res.status(statusCode.BAD_REQUEST).send(util.fail(statusCode.BAD_REQUEST, responseMessage.WRONG_IMAGE));

    const result = {user: {profileId: userData.profileId, name: userData.name, image: userData.image}};

    res.status(statusCode.OK).send(util.success(statusCode.OK, responseMessage.UPDATE_USER, result));
    
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