const _ = require('lodash');
const convertSnakeToCamel = require('../lib/convertSnakeToCamel');

const getTest = async (client) => {
  const { rows } = await client.query(
    `
    SELECT * FROM test
    `,
  );

  return convertSnakeToCamel.keysToCamel(rows);
};

module.exports = { getTest };
