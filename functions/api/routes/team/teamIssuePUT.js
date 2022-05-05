const functions = require('firebase-functions');
const util = require('../../../lib/util');
const statusCode = require('../../../constants/statusCode');
const responseMessage = require('../../../constants/responseMessage');
const db = require('../../../db/db');
const slackAPI = require('../../../lib/slackAPI');
const { issueDB } = require('../../../db');

module.exports = async (req, res) => {

  const user = req.user;
  const { issueId } = req.params;
  const { categoryId, content, image } = req.body;
  const imageUrls = req.imageUrls;
  
  if (!user || !issueId || !categoryId || !content) return res.status(statusCode.BAD_REQUEST).send(util.fail(statusCode.BAD_REQUEST, responseMessage.NULL_VALUE));
  
  let client;
  
  
  
  try {
    client = await db.connect(req);

    //^_^// userId가 이슈의 userId와 일치하는지 확인
    const checkUser = await issueDB.checkIssueUserId(client, issueId);

    if(checkUser.userId != user.id) {
      //^_^// 이슈의 작성자가 아닌 경우 수정하지 못하도록 함
      return res.status(statusCode.FORBIDDEN).send(util.fail(statusCode.FORBIDDEN, responseMessage.NO_AUTH_MEMBER));
    };

    
    let issueData;
    //^_^// 이슈 수정 후 issueData에 결과값 담아오기
    if (image === undefined) {
      if (imageUrls === undefined) { //^_^// 이미지 변화 없는 경우
        issueData = await issueDB.updateIssueWithoutImage(client, issueId, categoryId, content);
      } else { //^_^// 이미지 파일 업데이트 하는 경우
        issueData = await issueDB.updateIssueIncludeImage(client, issueId, categoryId, content, imageUrls);
      };
    } else {
      if (image.replace(" ","") === "") { //^_^// 공백 제거했을 때 빈문자열인 경우 (삭제하는 경우)
        const nullImage = null;
        issueData = await issueDB.updateIssueIncludeImage(client, issueId, categoryId, content, nullImage);
      };
    };
  
    //^_^// image 값이 잘못되었을 경우
    if (issueData === undefined) return res.status(statusCode.BAD_REQUEST).send(util.fail(statusCode.BAD_REQUEST, responseMessage.WRONG_IMAGE));

    const resultData = {
      issue: issueData
    };

    res.status(statusCode.OK).send(util.success(statusCode.OK, responseMessage.UPDATE_ISSUE, resultData));
    
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