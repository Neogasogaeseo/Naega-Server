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
module.exports = { addLinkAnswerKeyword, getKeywordsWithAnswerIdList };
