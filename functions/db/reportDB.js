const _ = require('lodash');
const { ClientBase } = require('pg');
const convertSnakeToCamel = require('../lib/convertSnakeToCamel');

const getReportCategory = async (client) => {
  const { rows } = await client.query(
    `
    SELECT c.id, c.name
    FROM "report_category" c
    JOIN "report_kind" k
    ON c.report_kind_id = k.id
    `,
  );
  console.log(rows);
  return convertSnakeToCamel.keysToCamel(rows);
};

const addReport = async (client, reporyCategoryId, userId, title, content, email, image) => {
  const { rows } = await client.query(
    /*sql*/ `
      INSERT INTO report
      (report_category_id, user_id,  title, content, email, image)
      VALUES 
      ($1, $2, $3, $4, $5, $6)
      RETURNING *
          `,
    [reporyCategoryId, userId, title, content, email, image],
  );
  return convertSnakeToCamel.keysToCamel(rows[0]);
};

module.exports = {
  getReportCategory,
  addReport,
};
