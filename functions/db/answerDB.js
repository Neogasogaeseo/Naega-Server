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

const getAnswerByFormId = async (client, formId) => {
  const { rows } = await client.query(
    `
        SELECT l.form_id, a.id,
        a.name, r.name as relationship,
        a.content, a.is_pinned, a.created_at
        FROM "answer" a
        JOIN "relationship" r
        ON a.relationship_id = r.id
        JOIN "link_user_form" l
        ON a.link_user_form_id = l.id
        WHERE l.form_id = ${formId}
        ORDER BY l.updated_at
        `,
  );
  return convertSnakeToCamel.keysToCamel(rows);
};

const getFormIdRecentAnswerListByUserId = async (client, userId) => {
  const { rows } = await client.query(
    `
    SELECT l.form_id
    FROM "link_user_form" l
    FULL JOIN "answer" a
    ON l.id = a.link_user_form_id
    WHERE l.user_id = $1
    ORDER BY a.updated_at DESC NULLs LAST
    `,
    [userId],
  );
  return convertSnakeToCamel.keysToCamel(rows);
};

const getAnswerByFormIdList = async (client, formIdList) => {
  const { rows } = await client.query(
    `
      SELECT l.form_id, a.id,
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

const addAnswer = async (client, linkFormId, name, relationshipId, content) => {
  //^_^// answer테이블에 insert하기
  const { rows } = await client.query(
    `
        INSERT INTO answer
        (link_user_form_id, name, relationship_id, content)
        VALUES
        ($1, $2, $3, $4)
        RETURNING *
        `,

    [linkFormId, name, relationshipId, content],
  );
  console.log(rows[0]);
  return convertSnakeToCamel.keysToCamel(rows[0]);
};

module.exports = { getRelationship, addAnswer, getFormIdRecentAnswerListByUserId, getAnswerByFormIdList, getAnswerByFormId };
