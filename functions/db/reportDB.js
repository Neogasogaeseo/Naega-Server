const _ = require('lodash');
const { ClientBase } = require('pg');
const convertSnakeToCamel = require('../lib/convertSnakeToCamel');

const getReportCategory = async (client, reportKindId) => {
  const { rows } = await client.query(
    `
    SELECT c.id, c.name
    FROM "report_category" c
    JOIN "report_kind" k
    ON c.report_kind_id = k.id
    WHERE k.id = ${reportKindId}
    `,
  );
  console.log(rows);
  return convertSnakeToCamel.keysToCamel(rows);
};

module.exports = {
  getReportCategory,
};
