const _ = require('lodash');
const convertSnakeToCamel = require('../lib/convertSnakeToCamel');

const checkKeyword = async (client, keyword, userId) => {
  const { rows } = await client.query(
    /*sql*/ `
        SELECT k.id ,k.name, color.code as colorCode , color.font_code as fontColor 
        FROM keyword k
        JOIN color ON k.color_id = color.id
        WHERE k.name = $1
        AND k.user_id = $2
        AND is_deleted = FALSE
        `,
    [keyword, userId],
  );
  return convertSnakeToCamel.keysToCamel(rows[0]);
};

const getKeywordById = async (client, keywordId) => {
  const { rows } = await client.query(
    /*sql*/ `
        SELECT *
        FROM keyword k
        WHERE k.id = $1
        AND is_deleted = FALSE
        `,
    [keywordId],
  );
  return convertSnakeToCamel.keysToCamel(rows[0]);
};

const addKeyword = async (client, keywordId) => {
  const { rows } = await client.query(
    /*sql*/ `
        UPDATE keyword
        SET count = count+1, updated_at = now()
        WHERE
        id = $1 AND is_deleted = false
        RETURNING keyword.id, keyword.name, 
        (SELECT color.code FROM color WHERE color.id = keyword.color_id)as colorCode, 
        (SELECT color.font_code  FROM color WHERE color.id = keyword.color_id)as fontColor
        `,
    [keywordId],
  );
  return convertSnakeToCamel.keysToCamel(rows[0]);
};

const addNewKeyword = async (client, name, userId, colorId) => {
  const { rows } = await client.query(
    /*sql*/ `
        INSERT INTO keyword
        ("name", user_id, color_id,count)
        VALUES
        ($1, $2, $3,1)
        RETURNING keyword.id, keyword.name, 
        (SELECT color.code FROM color WHERE color.id = $3)as colorCode, 
        (SELECT color.font_code  FROM color WHERE color.id = $3)as fontColor
        `,
    [name, userId, colorId],
  );
  return convertSnakeToCamel.keysToCamel(rows[0]);
};

const getKeywordList = async (client, userId, offset, limit) => {
  const { rows } = await client.query(
    /*sql*/ `
        SELECT k.id, k.name, color.code as colorCode, color.font_code as fontColor, k.count FROM keyword k
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

const getKeywordByAnswerId = async (client, answerIdList) => {
  const { rows } = await client.query(
    `
    SELECT l.answer_id, k.id, k.name, c.code as color_code
    FROM "link_answer_keyword" l
    JOIN "keyword" k
    ON l.keyword_id = k.id
    JOIN "color" c
    ON k.color_id = c.id
    JOIN "answer" a
    ON l.answer_id = a.id
    JOIN "link_user_form" u
    ON a.link_user_form_id = u.id
    WHERE l.is_deleted = false
    AND l.answer_id in (${answerIdList.join(',')})
    `,
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
        `);
  return convertSnakeToCamel.keysToCamel(rows);
};

const getKeywordListByFeedbackId = async (client, feedbackIdList) => {
  const feedbackIdQuery = '(' + feedbackIdList.map((o) => o).join(', ') + ')';

  const { rows: keywordRows } = await client.query(
    `
    SELECT l.feedback_id, k.name, k.color_id, color.code as color_code
    FROM keyword k
    JOIN link_feedback_keyword l ON l.keyword_id = k.id
    JOIN color ON color.id = k.color_id
    WHERE l.feedback_id IN ${feedbackIdQuery}
      AND l.is_deleted = false
      AND k.is_deleted = false
    `,
  );
  if (!keywordRows) return [];
  return convertSnakeToCamel.keysToCamel(keywordRows);
};

const getKeywordListByAnswerId = async (client, answerIdList) => {
  const answerIdQuery = '(' + answerIdList.map((o) => o).join(', ') + ')';
  const { rows: keywordRows } = await client.query(
    `
    SELECT l.answer_id, k.name, k.color_id, color.code as color_code
    FROM keyword k
    JOIN link_answer_keyword l ON l.keyword_id = k.id
    JOIN color ON color.id = k.color_id
    WHERE l.answer_id IN ${answerIdQuery}
      AND l.is_deleted = false
      AND k.is_deleted = false
    `,
  );
  if (!keywordRows) return [];
  return convertSnakeToCamel.keysToCamel(keywordRows);
};

const deleteKeywordAndCount = async (client, keywordId) => {
  const { rows } = await client.query(/*sql*/ `
        UPDATE keyword 
        SET count = 0, is_deleted = true
        WHERE id = ${keywordId}
        RETURNING *
        `);
  return convertSnakeToCamel.keysToCamel(rows);
};

const deleteKeyword = async (client, keywordId) => {
  const { rows } = await client.query(/*sql*/ `
        UPDATE keyword 
        SET is_deleted = true
        WHERE id = ${keywordId}
        RETURNING *
        `);
  return convertSnakeToCamel.keysToCamel(rows);
};

const deleteMyKeyword = async (client, keywordId, userId) => {
  const { rows } = await client.query(/*sql*/ `
        UPDATE keyword 
        SET is_deleted = true
        WHERE id = ${keywordId} AND user_id = ${userId}
        RETURNING *
        `);
  return convertSnakeToCamel.keysToCamel(rows);
};

const deleteKeywordCount = async (client, keywordId) => {
  const { rows } = await client.query(/*sql*/ `
        UPDATE keyword 
        SET count = count-1
        WHERE id = ${keywordId}
        RETURNING *
        `);
  return convertSnakeToCamel.keysToCamel(rows);
};

module.exports = {
  checkKeyword,
  getKeywordById,
  addKeyword,
  addNewKeyword,
  getKeywordList,
  keywordCountUpdate,
  getTopKeyword,
  getTeamKeywordList,
  getKeywordListByFeedbackId,
  getKeywordListByAnswerId,
  getKeywordByAnswerId,
  deleteKeywordAndCount,
  deleteKeywordCount,
  deleteKeyword,
  deleteMyKeyword,
};
