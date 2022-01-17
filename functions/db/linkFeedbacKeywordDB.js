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
const getKeywords = async (client, feedbackIds) => {
  const { rows } = await client.query(/*sql*/ `
        SELECT keyword.id,keyword.name,color.code as colorCode, link_feedback_keyword.keyword_id, link_feedback_keyword.feedback_id  
        FROM link_feedback_keyword
        JOIN keyword ON keyword.id = link_feedback_keyword.keyword_id
        JOIN color ON keyword.color_id = color.id
        WHERE link_feedback_keyword.feedback_id IN (${feedbackIds.join()})
        `);
  return convertSnakeToCamel.keysToCamel(rows);
};
module.exports = { addLinkFeedbackKeyword, getKeywords };
