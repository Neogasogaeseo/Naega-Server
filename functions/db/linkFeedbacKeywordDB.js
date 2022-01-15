const _ = require('lodash');
const convertSnakeToCamel = require('../lib/convertSnakeToCamel');

const addLinkFeedbackKeyword = async (client, feedbackId, keywordIds) => {
  const valuesQuery = keywordIds.map((x) => `(${feedbackId}, ${x})`).join(',');
  console.log('valuesQuery : ', valuesQuery);
  let rows = { rows: null };
  if (keywordIds.length > 0) {
    rows = await client.query(/*sql*/ `
            INSERT INTO link_feedback_keyword(feedback_id,keyword_id)
            VALUES ${valuesQuery}
            RETURNING *
            `);
  }

  return convertSnakeToCamel.keysToCamel(rows.rows);
};

module.exports = { addLinkFeedbackKeyword };
