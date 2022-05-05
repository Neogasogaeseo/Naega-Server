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
          SELECT keyword.id,keyword.name,color.code as colorCode,color.font_code as fontColor, link_answer_keyword.answer_id  
          FROM link_answer_keyword
          JOIN keyword ON keyword.id = link_answer_keyword.keyword_id
          JOIN color ON keyword.color_id = color.id
          WHERE link_answer_keyword.answer_id IN (${answerIds.join()})
          `);
  return convertSnakeToCamel.keysToCamel(rows);
};

const getKeywordsWithAnswerIdListForFormDetail = async (client, answerIds) => {
  if (answerIds.length === 0) return [];
  const { rows } = await client.query(/*sql*/ `
          SELECT keyword.id,keyword.name,color.code as colorCode,color.font_code as fontColor  
          FROM link_answer_keyword
          JOIN keyword ON keyword.id = link_answer_keyword.keyword_id
          JOIN color ON keyword.color_id = color.id
          WHERE link_answer_keyword.answer_id IN (${answerIds.join()})
          ORDER BY keyword.count DESC
          -- LIMIT 5
          `);
  return convertSnakeToCamel.keysToCamel(rows);
};

const getTopKeywordListOnAnswer = async (client, userId) => {
  const { rows } = await client.query(/*sql*/ `
    SELECT l.keyword_id, l.count_keyword_id, k.name as keyword_name, k.user_id, k.color_id, c.code as color_code, c.font_code as font_color
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
    `);
  console.log(rows);
  return convertSnakeToCamel.keysToCamel(rows);
};

const deleteLinkAnswerKeyword = async (client, answerId, keywordIds) => {
  let rows = { rows: null };
  if (keywordIds.length > 0) {
    rows = await client.query(/*sql*/ `
            UPDATE link_answer_keyword
            SET is_deleted = true
            WHERE answer_id = ${answerId}
            AND is_deleted = false
            AND link_answer_keyword.keyword_id IN (${keywordIds.join()})
            RETURNING *
            `);
  }

  return convertSnakeToCamel.keysToCamel(rows.rows);
};

module.exports = { addLinkAnswerKeyword, getKeywordsWithAnswerIdList, getKeywordsWithAnswerIdListForFormDetail, getTopKeywordListOnAnswer, deleteLinkAnswerKeyword };
