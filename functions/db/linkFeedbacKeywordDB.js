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
const getKeywordsWithFeedbackIdList = async (client, feedbackIds) => {
  const { rows } = await client.query(/*sql*/ `
        SELECT keyword.id,keyword.name,color.code as colorCode, link_feedback_keyword.feedback_id  
        FROM link_feedback_keyword
        JOIN keyword ON keyword.id = link_feedback_keyword.keyword_id
        JOIN color ON keyword.color_id = color.id
        WHERE link_feedback_keyword.feedback_id IN (${feedbackIds.join()})
        `);
  return convertSnakeToCamel.keysToCamel(rows);
};


const getTopKeywordListOnFeedback = async (client, profileId) => {
  const { rows } = client.query(
    `
    SELECT l.keyword_id, l.count_keyword_id, k.name as keyword_name, k.user_id, k.color_id, c.code, u.profile_id
    FROM (SELECT keyword_id, COUNT(keyword_id) as count_keyword_id
           FROM link_feedback_keyword
           WHERE is_deleted = false
           GROUP BY keyword_id) l
   JOIN "keyword" k ON l.keyword_id = k.id
   JOIN "user" u ON u.id = k.user_id
   JOIN "color" c ON c.id = k.color_id
   WHERE u.profile_id = $1
       AND k.is_deleted = false
   ORDER BY l.count_keyword_id DESC
   LIMIT 3
   `,

    [profileId]
  );
  console.log(rows);
  return convertSnakeToCamel.keysToCamel(rows);
};

module.exports = { addLinkFeedbackKeyword, getKeywordsWithFeedbackIdList, getTopKeywordListOnFeedback, };
