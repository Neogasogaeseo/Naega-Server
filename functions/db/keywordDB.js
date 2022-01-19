const _ = require('lodash');
const convertSnakeToCamel = require('../lib/convertSnakeToCamel');

const checkKeyword = async (client, keyword, userId) => {
  const { rows } = await client.query(
    /*sql*/ `
        SELECT k.name, color.code FROM keyword k
        JOIN color ON k.color_id = color.id
        WHERE k.name = $1
        AND k.user_id = $2
        AND is_deleted = FALSE
        `,
    [keyword, userId],
  );
  return convertSnakeToCamel.keysToCamel(rows[0]);
};

const addKeyword = async (client, name, userId, colorId) => {
  const { rows } = await client.query(
    /*sql*/ `
        INSERT INTO keyword
        ("name", user_id, color_id)
        VALUES
        ($1, $2, $3)
        `,
    [name, userId, colorId],
  );
  return convertSnakeToCamel.keysToCamel(rows[0]);
};

const getKeywordList = async (client, userId, offset, limit) => {
  const { rows } = await client.query(
    /*sql*/ `
        SELECT k.id, k.name, color.code as colorCode FROM keyword k
        JOIN color ON k.color_id = color.id
        WHERE k.user_id = $1
        AND is_deleted = FALSE
        ORDER BY k.count DESC
        LIMIT $3 OFFSET $2 
        `,
    [userId, offset, limit],
  );
  return convertSnakeToCamel.keysToCamel(rows);
};

const keywordCountUpdate = async (client, keywordIds) => {
  const valuesQuery = `(${keywordIds.map((x) => x).join(',')})`;
  const { rows } = await client.query(/*sql*/ `
        UPDATE keyword 
        SET count = count+1
        WHERE id in ${valuesQuery}
        RETURNING *
        `);
  return convertSnakeToCamel.keysToCamel(rows);
};

const getTeamKeywordList = async (client, userId, limit) => {
  //^_^// 링크 테이블과의 조인 방법 다시 고민해봐야함
  const { rows } = await client.query(
    /*sql*/ `
        SELECT k.id, k.name, color.code FROM keyword k
        JOIN color ON k.color_id = color.id
        WHERE k.user_id = $1
        AND is_deleted = FALSE
        LIMIT $2
        `,
    [userId, limit],
  );
  return convertSnakeToCamel.keysToCamel(rows);
};

const getTopKeyword = async (client, userId) => {
  const { rows } = await client.query(/*sql*/ `
        SELECT k.id, k.name, color.code as colorCode 
        FROM keyword k
        JOIN color ON k.color_id = color.id
        WHERE k.user_id = ${userId}
        AND is_deleted = FALSE
        ORDER BY k.count DESC
        LIMIT 5 OFFSET 0 
        `);
  return convertSnakeToCamel.keysToCamel(rows);
};

const getKeywordListByFeedbackId = async (client, feedbackIdList) => {
  const feedbackIdQuery = "(" + feedbackIdList.map(o => o).join(', ') + ')';
 
  const { rows: keywordRows } = await client.query (
    `
    SELECT l.feedback_id, k.name, k.color_id, color.code as color_code
    FROM keyword k
    JOIN link_feedback_keyword l ON l.keyword_id = k.id
    JOIN color ON color.id = k.color_id
    WHERE l.feedback_id IN ${feedbackIdQuery}
      AND l.is_deleted = false
      AND k.is_deleted = false
    `
  );
  if (!keywordRows) return [];
  return convertSnakeToCamel.keysToCamel(keywordRows);
};

const getKeywordListByAnswerId = async (client, answerIdList) => {
  const answerIdQuery = "(" + answerIdList.map(o => o).join(', ') + ')';
  const { rows: keywordRows } = await client.query (
    `
    SELECT l.answer_id, k.name, k.color_id, color.code as color_code
    FROM keyword k
    JOIN link_answer_keyword l ON l.keyword_id = k.id
    JOIN color ON color.id = k.color_id
    WHERE l.answer_id IN ${answerIdQuery}
      AND l.is_deleted = false
      AND k.is_deleted = false
    `
  );
  if (!keywordRows) return [];
  return convertSnakeToCamel.keysToCamel(keywordRows);
};

module.exports = { checkKeyword, addKeyword, getKeywordList, keywordCountUpdate, getTopKeyword, getTeamKeywordList, getKeywordListByFeedbackId, getKeywordListByAnswerId, };
