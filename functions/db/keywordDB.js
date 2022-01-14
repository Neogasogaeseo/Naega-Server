const _ = require('lodash');
const convertSnakeToCamel = require('../lib/convertSnakeToCamel');



const checkKeyword = async (client, keyword) => {
  const { rows } = await client.query(
    `
        SELECT k.name FROM keyword k
        WHERE name = $1
          AND is_deleted = FALSE
        `,
    [keyword],
  );
  return convertSnakeToCamel.keysToCamel(rows[0]);
};


const addKeyword = async (client, name, userId) => {
    const { rows } = await client.query(
        `
        INSERT INTO keyword
        (name, user_id)
        VALUES
        ($1, $2)
        RETURNING *
        `,
        [name, userId],
      );
    return convertSnakeToCamel.keysToCamel(rows[0]);
  };

module.exports = { checkKeyword ,addKeyword};
