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

const getKeywordByAnswerId = async (client, answerIdList) => {
  const { rows } = await client.query(
    `
    SELECT u.form_id as id, k.id as keyword_id, k.name, c.code as color_code
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
        LIMIT 5 OFFSET 0 
        `);
  return convertSnakeToCamel.keysToCamel(rows);
};

module.exports = { checkKeyword, addKeyword, getKeywordList, keywordCountUpdate, getKeywordByAnswerId, getTopKeyword };
