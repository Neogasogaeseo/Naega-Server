const functions = require('firebase-functions');
const util = require('../../../lib/util');
const statusCode = require('../../../constants/statusCode');
const responseMessage = require('../../../constants/responseMessage');
const db = require('../../../db/db');
const { userDB, feedbackDB, keywordDB, linkFeedbacKeywordDB } = require('../../../db');

module.exports = async (req, res) => {
  const { profileId } = req.query;

  if (!profileId) return res.status(statusCode.BAD_REQUEST).send(util.fail(statusCode.BAD_REQUEST, responseMessage.NULL_VALUE));

  let client;

  try {
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
  } catch (error) {
    functions.logger.error(`[ERROR] [${req.method.toUpperCase()}] ${req.originalUrl}`, `[CONTENT] ${error}`);
    console.log(error);

    res.status(statusCode.INTERNAL_SERVER_ERROR).send(util.fail(statusCode.INTERNAL_SERVER_ERROR, responseMessage.INTERNAL_SERVER_ERROR));
  } finally {
    client.release();
  }
};
