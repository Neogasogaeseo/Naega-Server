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
<<<<<<< HEAD
        SELECT keyword.id,keyword.name,color.code as colorCode, link_feedback_keyword.keyword_id, link_feedback_keyword.feedback_id  
        FROM link_feedback_keyword
        JOIN keyword ON keyword.id = link_feedback_keyword.keyword_id
        JOIN color ON keyword.color_id = color.id
        WHERE link_feedback_keyword.feedback_id IN (${feedbackIds.join()})
=======
        SELECT keyword.*,color.*,link_feedback_keyword.* FROM link_feedback_keyword
        JOIN keyword ON keyword.id = link_feedback_keyword.keyword_id
        JOIN color ON k.color_id = color.id
        WHERE link_feedback_keyword.id IN (${feedbackIds.join()})
>>>>>>> 08cfa28e4cee748a5e68d6bf896ad4f8c8fc9200
        `);
  return convertSnakeToCamel.keysToCamel(rows);
};
module.exports = { addLinkFeedbackKeyword, getKeywords };
