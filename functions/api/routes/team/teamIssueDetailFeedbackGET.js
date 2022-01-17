const functions = require('firebase-functions');
const util = require('../../../lib/util');
<<<<<<< HEAD
const arrayHandler = require('../../../lib/arrayHandler');
=======
>>>>>>> 08cfa28e4cee748a5e68d6bf896ad4f8c8fc9200
const statusCode = require('../../../constants/statusCode');
const responseMessage = require('../../../constants/responseMessage');
const db = require('../../../db/db');
const { userDB, feedbackDB, keywordDB, linkFeedbacKeywordDB } = require('../../../db');

module.exports = async (req, res) => {
<<<<<<< HEAD
  const { issueId } = req.params;

  if (!issueId) return res.status(statusCode.BAD_REQUEST).send(util.fail(statusCode.BAD_REQUEST, responseMessage.NULL_VALUE));
=======
  const { profileId } = req.query;

  if (!profileId) return res.status(statusCode.BAD_REQUEST).send(util.fail(statusCode.BAD_REQUEST, responseMessage.NULL_VALUE));
>>>>>>> 08cfa28e4cee748a5e68d6bf896ad4f8c8fc9200

  let client;

  try {
<<<<<<< HEAD
    client = await db.connect(req);

    // ^_^// issueId로 해당 이슈에 해당하는 모든 feedback 가져옴
    const feedbacks = await feedbackDB.getFeedbacks(client, issueId);
    console.log('feedbacks : ', feedbacks);

    // ^_^// 가져온 feedbacks들의 id만 추출
    const feedbackIds = arrayHandler.extractValues(feedbacks, 'id');
    console.log('feedbackIds : ', feedbackIds);

    // ^_^// 추출한 feedbacks들로 키워드들 가져옴
    const linkFeedbackKeywords = await linkFeedbacKeywordDB.getKeywords(client, feedbackIds);
    console.log('linkFeedbackKeywords : ', linkFeedbackKeywords);

    const feedbacksTofind = feedbacks.reduce((acc, x) => {
      acc[x.id] = { ...x, keywords: [] };
      return acc;
    }, {});
    console.log('feedbacksTofind', feedbacksTofind);

    linkFeedbackKeywords.map((o) => {
      feedbacksTofind[o.feedbackId].keywords.push(o);
      return o;
    });
    console.log(feedbacksTofind);

    const issueDetailFeedback = Object.entries(feedbacksTofind).map(([feedbackId, data]) => ({ ...data }));
    console.log('issueDetailFeedback', issueDetailFeedback);

    res.status(statusCode.OK).send(util.success(statusCode.OK, responseMessage.READ_ISSUE_FEEDBACK_SUCCESS, issueDetailFeedback));
=======
    const extractValues = (arr, key) => {
      if (!Array.isArray(arr)) return [arr[key] || null];
      return [...new Set(arr.map((o) => o[key]).filter(Boolean))];
    };
    client = await db.connect(req);
    const issueId = 2;
    const feedbacks = await feedbackDB.getFeedbacks(client, issueId);
    const feedbackIds = extractValues(feedbacks, 'id');
    const linkFeedbackKeywords = await linkFeedbacKeywordDB.getKeywords(client, feedbackIds);

    const test = linkFeedbackKeywords.reduce((acc, x) => {
      if (!acc[x.feedbackId]) {
        acc[x.feedbackId] = { ...feedbacks.find((x) => feedbacks.id === x.feedbackId), keywords: [] };
      }
      acc[x.feedbackId].keywords.push(x);
    }, {});

    const test2 = Object.entries(test).map(([feedbackId, data]) => ({ feedbackId, ...data }));

    console.log(test2);
>>>>>>> 08cfa28e4cee748a5e68d6bf896ad4f8c8fc9200
  } catch (error) {
    functions.logger.error(`[ERROR] [${req.method.toUpperCase()}] ${req.originalUrl}`, `[CONTENT] ${error}`);
    console.log(error);

    res.status(statusCode.INTERNAL_SERVER_ERROR).send(util.fail(statusCode.INTERNAL_SERVER_ERROR, responseMessage.INTERNAL_SERVER_ERROR));
  } finally {
    client.release();
  }
};
