const functions = require('firebase-functions');
const util = require('../../../lib/util');
const statusCode = require('../../../constants/statusCode');
const responseMessage = require('../../../constants/responseMessage');
const db = require('../../../db/db');
const slackAPI = require('../../../lib/slackAPI');
const { answerDB, linkAnswerKeywordDB, linkUserFormDB } = require('../../../db');
const arrayHandler = require('../../../lib/arrayHandler');
const dayjs = require('dayjs');

module.exports = async (req, res) => {
  const { id: userId } = req.user;
  const { formId } = req.params;
  let { offset } = req.query;
  if (!formId) {
    return res.status(statusCode.BAD_REQUEST).send(util.fail(statusCode.BAD_REQUEST, responseMessage.NULL_VALUE));
  }
  if (!offset) {
    offset = 0;
  }
  let client;

  try {
    client = await db.connect(req);
    console.log(userId);

    // ^_^// formId로 해당 폼에 해당하는 모든 answer 가져옴
    const answerCount = await answerDB.getAnswerCountByFormIdAndUserId(client, formId, userId);
    console.log('answerCount : ', answerCount);

    if (answerCount.length === 0) {
      return res.status(statusCode.OK).send(util.success(statusCode.OK, responseMessage.NO_FORM_ISSUE, []));
    }

    const answers = await answerDB.getAnswerByFormIdAndUserId(client, formId, userId, offset);

    if (!answers) {
      return res.status(statusCode.NOT_FOUND).send(util.fail(statusCode.NOT_FOUND, responseMessage.NO_MORE_ANSWER));
    }

    console.log('answers :', answers);
    for (const answer of answers) {
      answer.createdAt = dayjs(answer.createdAt).format('YYYY-MM-DD');
    }

    // ^_^// 가져온 answers들의 id만 추출
    const answersIds = arrayHandler.extractValues(answers, 'id');
    console.log('answersIds : ', answersIds);

    // ^_^// 추출한 answers들로 키워드들 가져옴
    const linkAnswerKeywords = await linkAnswerKeywordDB.getKeywordsWithAnswerIdList(client, answersIds);
    console.log('linkAnswerKeywords : ', linkAnswerKeywords);

    // ^_^// 추출한 answers들에 keywords를 넣어주기 위해 가공 -> answer id로 그룹화 해준다
    const answersTofind = answers.reduce((acc, x) => {
      acc[x.id] = { ...x, keywords: [] };
      return acc;
    }, {});
    console.log('answersTofind', answersTofind);

    // ^_^// answerId로 그룹화 해준 answers들에 keywords를 넣어준다..
    linkAnswerKeywords.map((o) => {
      answersTofind[o.answerId].keywords.push(o);
      return o;
    });
    console.log('answersTofind : ', answersTofind);

    // ^_^// 그룹핑해둔 값들을 풀어준다
    const formDetailAnswer = Object.entries(answersTofind).map(([answerId, data]) => ({ ...data }));
    console.log('issueDetailAnswer', formDetailAnswer);

    // const answerCount = formDetailAnswer.length;
    const data = { answerCount, answer: formDetailAnswer };

    res.status(statusCode.OK).send(util.success(statusCode.OK, responseMessage.READ_FORM_ANSWER_DETAIL_SUCCESS, data));
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
