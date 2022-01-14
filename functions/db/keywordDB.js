const _ = require('lodash');
const convertSnakeToCamel = require('../lib/convertSnakeToCamel');

const checkKeyword = async (client, keyword) => {
  const { rows } = await client.query(
    /*sql*/ `
        SELECT k.name, color.code FROM keyword k
        JOIN color ON k.color_id = color.id
        WHERE k.name = $1
        AND is_deleted = FALSE
        `,
    [keyword],
  );
  return convertSnakeToCamel.keysToCamel(rows[0]);
};

const addKeyword = async (client, name, userId, colorId) => {
  const { rows } = await client.query(
    /*sql*/ `
        INSERT INTO keyword
        (name, user_id,color_id)
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
        SELECT k.id, k.name, color.code FROM keyword k
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

module.exports = { checkKeyword, addKeyword, getKeywordList };
