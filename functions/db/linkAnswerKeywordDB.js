const _ = require('lodash');
const convertSnakeToCamel = require('../lib/convertSnakeToCamel');

const addLinkAnswerKeyword = async (client, answerId, keywordList) => {
  const valuesQeury = keywordList
    .map((x) => `(${answerId}, ${x})`)
    .join(', ')
    .toString();

  const { rows } = await client.query(
    `
    INSERT INTO link_answer_keyword
    (answer_id, keyword_id)
    VALUES
    ${valuesQeury}
    RETURNING *
    `,
  );
  return convertSnakeToCamel.keysToCamel(rows);
};

const getKeywordsWithAnswerIdList = async (client, answerIds) => {
  const { rows } = await client.query(/*sql*/ `
          SELECT keyword.id,keyword.name,color.code as colorCode, link_answer_keyword.answer_id  
          FROM link_answer_keyword
          JOIN keyword ON keyword.id = link_answer_keyword.keyword_id
          JOIN color ON keyword.color_id = color.id
          WHERE link_answer_keyword.answer_id IN (${answerIds.join()})
          `);
  return convertSnakeToCamel.keysToCamel(rows);
};

const getTopKeywordListOnAnswer = async (client, userId) => {
  const { rows } = await client.query (
    `
    SELECT l.keyword_id, l.count_keyword_id, k.name as keyword_name, k.user_id, k.color_id, c.code
    FROM (SELECT keyword_id, COUNT(keyword_id) as count_keyword_id
           FROM link_answer_keyword
           WHERE is_deleted = false
           GROUP BY keyword_id) l
   JOIN "keyword" k ON l.keyword_id = k.id
   JOIN "color" c ON c.id = k.color_id
   WHERE k.user_id = ${userId}
      AND k.is_deleted = false
   ORDER BY l.count_keyword_id DESC
   LIMIT 3
    `,
  );
  console.log(rows);
  return convertSnakeToCamel.keysToCamel(rows);
};
module.exports = { addLinkAnswerKeyword, getKeywordsWithAnswerIdList, getTopKeywordListOnAnswer, };
