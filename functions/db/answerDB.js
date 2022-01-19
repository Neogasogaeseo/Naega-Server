const _ = require('lodash');
const convertSnakeToCamel = require('../lib/convertSnakeToCamel');

const getRelationship = async (client) => {
  const { rows } = await client.query(
    `
        SELECT *
        FROM relationship
        `,
  );
  return convertSnakeToCamel.keysToCamel(rows);
};

const getFormIdRecentAnswerListByUserId = async (client, userId) => {
  const { rows } = await client.query(
    `
    SELECT l.form_id
    FROM "link_user_form" l
    JOIN "answer" a
    ON l.id = a.link_user_form_id
    WHERE l.user_id = $1
    ORDER BY a.updated_at DESC
    `,
    [userId],
  );
  return convertSnakeToCamel.keysToCamel(rows);
};

const getAnswerByFormIdList = async (client, formIdList) => {
  const { rows } = await client.query(
    `
      SELECT l.form_id as id, a.id as answer_id,
      a.name, r.name as relationship,
      a.content
      FROM "answer" a
      JOIN "relationship" r
      ON a.relationship_id = r.id
      JOIN "link_user_form" l
      ON a.link_user_form_id = l.id
      WHERE l.form_id in (${formIdList.join(',')})
      ORDER BY l.updated_at
      `,
  );
  return convertSnakeToCamel.keysToCamel(rows);
};

module.exports = { getRelationship, getFormIdRecentAnswerListByUserId, getAnswerByFormIdList };
