const _ = require('lodash');
const convertSnakeToCamel = require('../lib/convertSnakeToCamel');

const getAllFormByUserId = async (client, userId) => {
  const { rows } = await client.query(
    `
    SELECT f.id, f.title, f.subtitle,
    f.is_new, f.is_banner, f.dark_icon_image,
    c.font_code as color_code
    FROM "form" f
    JOIN "color" c
    ON f.color_id = c.id
    FULL OUTER JOIN (SELECT * FROM 
    "link_user_form" l
    WHERE l.is_deleted = false
    AND l.user_id = $1) ll
    ON ll.form_id=f.id
    WHERE f.is_deleted = false
    ORDER BY ll.created_at DESC, f.updated_at DESC
    `,
    [userId],
  );
  return convertSnakeToCamel.keysToCamel(rows);
};

const getAllFormRecent = async (client) => {
  const { rows } = await client.query(
    `
    SELECT f.id, f.title, f.subtitle,
    f.is_new, f.is_banner, f.dark_icon_image,
    c.font_code as color_code
    FROM "form" f
    JOIN "color" c
    ON f.color_id = c.id
    WHERE f.is_deleted =false
    ORDER BY f.updated_at DESC
    `,
  );
  return convertSnakeToCamel.keysToCamel(rows);
};

const getAllFormPopular = async (client) => {
  const { rows } = await client.query(
    `
    SELECT f.id, f.title, f.subtitle,
    f.is_new, f.is_banner, f.dark_icon_image,
    c.font_code as color_code
    FROM "form" f
    LEFT JOIN (SELECT form_id, COUNT(*) cnt
      FROM "link_user_form"
      GROUP BY form_id) l
    ON f.id = l.form_id
    JOIN "color" c
    ON c.id = f.color_id
    WHERE f.is_deleted = false
    ORDER BY l.cnt DESC NULLS LAST
    `,
  );
  return convertSnakeToCamel.keysToCamel(rows);
};

const getFormIsCreatedByUserId = async (client, formIdList, userId) => {
  const { rows } = await client.query(
    `
    SELECT l.form_id as id, l.is_deleted
    FROM "link_user_form" l
    WHERE l.user_id = $1
    AND l.form_id in (${formIdList.join(',')})
    `,
    [userId],
  );
  return convertSnakeToCamel.keysToCamel(rows);
};

const getFormIsCreatedByUserIdAndFormId = async (client, formId, userId) => {
  const { rows } = await client.query(
    `
    SELECT l.form_id as id, l.is_deleted
    FROM "link_user_form" l
    WHERE l.user_id = $1
    AND l.form_id = $2
    `,
    [userId, formId],
  );
  return convertSnakeToCamel.keysToCamel(rows[0]);
};

const getFormByUserIdAndFormId = async (client, userId, formId) => {
  const { rows } = await client.query(
    `
    SELECT l.id
    FROM "link_user_form" l
    WHERE l.user_id = $1
    AND l.form_id = $2
    AND l.is_deleted = false
    `,
    [userId, formId],
  );
  return convertSnakeToCamel.keysToCamel(rows[0]);
};

const addForm = async (client, userId, formId) => {
  const { rows } = await client.query(
    `
        INSERT INTO "link_user_form"
        (user_id, form_id)
        VALUES
        ($1, $2)
        RETURNING *
        `,
    [userId, formId],
  );
  return convertSnakeToCamel.keysToCamel(rows[0]);
};

const getFormBanner = async (client) => {
  const { rows } = await client.query(
    `
    SELECT f.id, f.title, f.subtitle,
    f.is_new, f.is_banner, f.dark_icon_image,
    c.font_code as color_code
    FROM "form" f
    JOIN "color" c
    ON f.color_id = c.id
    WHERE f.is_deleted = false
    AND f.is_banner = true
    ORDER BY f.updated_at DESC
    `,
  );
  return convertSnakeToCamel.keysToCamel(rows[0]);
};

const getFormByFormId = async (client, formId) => {
  const { rows } = await client.query(
    `
    SELECT f.id, f.title, f.subtitle, f.dark_icon_image
    FROM "form" f
    WHERE f.is_deleted = false
    AND f.id = $1
    `,
    [formId],
  );
  return convertSnakeToCamel.keysToCamel(rows[0]);
};

const getFormByFormIdAndUserId = async (client, formId, userId) => {
  const { rows } = await client.query(
    `
    SELECT f.id, f.title, f.subtitle, f.dark_icon_image
    FROM "form" f
    JOIN "link_user_form" l
    ON l.form_id = f.id
    WHERE f.is_deleted = false
    AND f.id = $1
    AND l.user_id = $2
    `,

    [formId, userId],
  );
  return convertSnakeToCamel.keysToCamel(rows[0]);
};

const getFormDetail = async (client, formId, userId) => {
  const { rows } = await client.query(
    `
    SELECT f.id, f.title, f.subtitle, f.dark_icon_image, l.created_at
    FROM "form" f
    JOIN link_user_form l ON l.form_id = f.id AND l.user_id = ${userId} AND l.is_deleted = false
    WHERE f.id = ${formId}
    `,
  );
  return convertSnakeToCamel.keysToCamel(rows[0]);
};

const getFormByFormIdList = async (client, formIdList, userId) => {
  const { rows } = await client.query(
    `
    SELECT f.id, f.title, f.subtitle, f.dark_icon_image, l.created_at
    FROM "form" f
    JOIN "link_user_form" l
    ON l.form_id = f.id
    WHERE f.is_deleted = false
    AND l.is_deleted = false
    AND l.user_id = $1
    AND f.id in (${formIdList.join(',')})
    ORDER BY l.created_at DESC
    `,
    [userId],
  );
  return convertSnakeToCamel.keysToCamel(rows);
};

const getCreatedFormListByUserId = async (client, userId) => {
  const { rows } = await client.query(
    `
    SELECT l.form_id, f.title, f.dark_icon_image, l.is_deleted
    FROM link_user_form l
    JOIN "form" f ON l.form_id = f.id
    WHERE l.user_id = $1
    AND l.is_deleted = false
    `,

    [userId],
  );
  return convertSnakeToCamel.keysToCamel(rows);
};

const getCreatedFormByUserIdAndFormId = async (client, userId, formId) => {
  const { rows } = await client.query(
    `
    SELECT l.id as link_user_form_id, l.created_at,
      l.user_id, u.name, u.image,
      l.form_id, f.title, f.subtitle, f.dark_icon_image
    FROM link_user_form l
    JOIN "user" u ON l.user_id = u.id
    JOIN form f ON l.form_id = f.id
    WHERE u.id = $1
      AND f.id = $2
      AND l.is_deleted = false
      AND u.is_deleted = false
      AND f.is_deleted = false
  `,
    [userId, formId],
  );
  return convertSnakeToCamel.keysToCamel(rows[0]);
};

module.exports = {
  getAllFormByUserId,
  getAllFormRecent,
  getFormByFormIdAndUserId,
  getAllFormPopular,
  getFormIsCreatedByUserId,
  getFormByUserIdAndFormId,
  getFormIsCreatedByUserIdAndFormId,
  addForm,
  getFormBanner,
  getFormDetail,
  getFormByFormId,
  getFormByFormIdList,
  getCreatedFormListByUserId,
  getCreatedFormByUserIdAndFormId,
};
