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

const getAnswerByFormIdAndUserId = async (client, formId, userId) => {
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
        AND l.user_id = $1
        ORDER BY l.updated_at
        `,
    [userId],
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

const getAnswerByFormIdListAndUserID = async (client, formIdList, userId) => {
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
      AND l.user_id = $1
      ORDER BY l.updated_at
      `,
    [userId],
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

const getPinnedAnswerByProfileId = async (client, profileId) => {
  const { rows } = await client.query(
    `
        SELECT l.user_id as user_id, u.profile_id, f.light_icon_image, f.title, a.id as answer_id, r.name as relationship_name, a.name, a.content, a.created_at, a.is_pinned
        FROM answer a
        JOIN link_user_form l ON a.link_user_form_id = l.id
        JOIN "user" u ON l.user_id = u.id
        JOIN relationship r ON a.relationship_id = r.id
        JOIN form f ON l.form_id = f.id
        WHERE u.profile_id = $1
            AND a.is_pinned = true
            AND a.is_deleted = false
            AND l.is_deleted = false
            AND u.is_deleted = false
            AND f.is_deleted = false
        ORDER BY a.created_at DESC
        `,

    [profileId],
  );
  return convertSnakeToCamel.keysToCamel(rows);
};

const toggleIsPinnedAnswer = async (client, answerId) => {
  const { rows } = await client.query(/*sql*/ `
    UPDATE answer
    SET is_pinned = NOT is_pinned, updated_at = now()
    WHERE id = ${answerId}
    AND is_deleted = false
    RETURNING answer.id, answer.is_pinned
    `);
  return convertSnakeToCamel.keysToCamel(rows[0]);
};

module.exports = {
  getRelationship,
  addAnswer,
  getAnswerByFormIdListAndUserID,
  getFormIdRecentAnswerListByUserId,
  getAnswerByFormIdList,
  getAnswerByFormIdAndUserId,
  getPinnedAnswerByProfileId,
  toggleIsPinnedAnswer,
};
