const _ = require('lodash');
const convertSnakeToCamel = require('../lib/convertSnakeToCamel');
const arrayHandler = require('../lib/arrayHandler');

const getRelationship = async (client) => {
  const { rows } = await client.query(
    `
        SELECT *
        FROM relationship
        ORDER BY id
        `,
  );
  return convertSnakeToCamel.keysToCamel(rows);
};

const getAnswerByFormIdAndUserId = async (client, formId, userId, offset) => {
  const { rows } = await client.query(/*sql*/ `
        SELECT l.form_id, a.id,
        a.name, r.name as relationship,
        a.content, a.is_pinned, a.created_at
        FROM "answer" a
        JOIN "relationship" r
        ON a.relationship_id = r.id
        JOIN "link_user_form" l
        ON a.link_user_form_id = l.id
        WHERE l.form_id = ${formId}
        AND l.user_id = ${userId}
        AND a.is_deleted = false
        AND l.is_deleted = false
        ORDER BY a.updated_at DESC
        OFFSET ${offset}
        LIMIT 10
        `);
  return convertSnakeToCamel.keysToCamel(rows);
};

const getAnswerUserIdByAnswerId = async (client, answerId) => {
  const { rows } = await client.query(/*sql*/ `
        SELECT u.id as user_id
        FROM "answer" a
        JOIN "link_user_form" l
        ON a.link_user_form_id = l.id
        JOIN "user" u
        ON l.user_id = u.id
        WHERE a.id = ${answerId}
        AND a.is_deleted = false
        AND l.is_deleted = false
        AND u.is_deleted = false
        `);
  return convertSnakeToCamel.keysToCamel(rows[0]);
};

const getAnswerCountByFormIdAndUserId = async (client, formId, userId) => {
  const { rows } = await client.query(/*sql*/ `
          SELECT count(*)
          FROM "answer" a
          JOIN "relationship" r
          ON a.relationship_id = r.id
          JOIN "link_user_form" l
          ON a.link_user_form_id = l.id
          WHERE l.form_id = ${formId}
          AND l.user_id = ${userId}
          AND a.is_deleted = false
          `);
  return convertSnakeToCamel.keysToCamel(rows[0].count);
};

const getAnswerByFormIdAndUserIdForFormDetailTopKeyword = async (client, formId, userId) => {
  const { rows } = await client.query(/*sql*/ `
        SELECT  a.id
        FROM "answer" a
        JOIN "relationship" r
        ON a.relationship_id = r.id
        JOIN "link_user_form" l
        ON a.link_user_form_id = l.id
        WHERE l.form_id = ${formId}
        AND l.user_id = ${userId}
        `);
  return convertSnakeToCamel.keysToCamel(rows);
};

const getFormIdListByUserId = async (client, userId) => {
  const { rows } = await client.query(
    `
    SELECT l.form_id as id, l.created_at, COUNT(a.id) as cnt
    FROM "link_user_form" l
    LEFT JOIN "answer" a
    ON l.id = a.link_user_form_id
    WHERE l.user_id = $1
    AND l.is_deleted = false
    GROUP BY l.form_id, l.created_at
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
      AND a.is_deleted = false
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
        SELECT l.user_id as user_id, u.profile_id, f.dark_icon_image, f.title, a.id as answer_id, r.name as relationship_name, a.name, a.content, a.created_at, a.is_pinned
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

const getAllAnswerByUserId = async (client, userId, offset, limit) => {
  const { rows } = await client.query(
    /*sql*/ `
    SELECT a.id as answer_id, l.form_id, f.dark_icon_image, f.title, a.content, a.is_pinned
    FROM link_user_form l
    JOIN answer a ON a.link_user_form_id = l.id
    JOIN "form" f ON l.form_id = f.id
    WHERE l.user_id = $1
      AND l.is_deleted = false
      AND a.is_deleted = false
    ORDER BY a.created_at DESC
    LIMIT $3  OFFSET $2   `,

    [userId, offset, limit],
  );
  return convertSnakeToCamel.keysToCamel(rows);
};

const getFilteredAnswerByFormId = async (client, userId, formId, offset, limit) => {
  const { rows } = await client.query(
    `
    SELECT a.id as answer_id, l.form_id, f.dark_icon_image, f.title, a.content, a.is_pinned
    FROM link_user_form l
    JOIN answer a ON a.link_user_form_id = l.id
    JOIN "form" f ON l.form_id = f.id
    WHERE l.user_id = $1
      AND l.form_id = $2
      AND l.is_deleted = false
      AND a.is_deleted = false
    ORDER BY a.created_at DESC
    OFFSET $3 LIMIT $4
    `,
    [userId, formId, offset, limit],
  );
  return convertSnakeToCamel.keysToCamel(rows);
};

const deleteAnswer = async (client, answerId) => {
  const { rows } = await client.query(/*sql*/ `
    UPDATE answer
    SET is_deleted = true, updated_at = now()
    WHERE id IN (${answerId.join(',')})
    AND is_deleted = false
    RETURNING *
    `);
  return convertSnakeToCamel.keysToCamel(rows);
};

const getAnswerCount = async (client, linkUserFormId) => {
  const { rows } = await client.query(
    `
    SELECT count(*) as answer_count
    FROM answer
    WHERE link_user_form_id = ${linkUserFormId}
      AND is_deleted = false
    `,
  );
  return convertSnakeToCamel.keysToCamel(rows[0]);
};

const getAllCreatedFormIdsByUserId = async (client, userId) => {
  const { rows } = await client.query(
    /*sql*/ `
    SELECT l.id
    FROM link_user_form l
    WHERE l.user_id = $1
    AND l.is_deleted = false
    `,
    [userId],
  );
  const result = arrayHandler.extractValues(rows, 'id');

  return convertSnakeToCamel.keysToCamel(result);
};

const deleteUserLinkForm = async (client, createdFormIds) => {
  const { rows } = await client.query(/*sql*/ `
    UPDATE link_user_form
    SET is_deleted = true, updated_at = now()
    WHERE id IN (${createdFormIds.join(',')})
    AND is_deleted = false
    RETURNING *
    `);
  return convertSnakeToCamel.keysToCamel(rows);
};

module.exports = {
  getRelationship,
  addAnswer,
  getAnswerByFormIdListAndUserID,
  getAnswerUserIdByAnswerId,
  getFormIdListByUserId,
  getAnswerByFormIdList,
  getAnswerByFormIdAndUserId,
  getAnswerCountByFormIdAndUserId,
  getAnswerByFormIdAndUserIdForFormDetailTopKeyword,
  getPinnedAnswerByProfileId,
  toggleIsPinnedAnswer,
  getAllAnswerByUserId,
  getFilteredAnswerByFormId,
  deleteAnswer,
  deleteUserLinkForm,
  getAnswerCount,
  getAllCreatedFormIdsByUserId,
};
