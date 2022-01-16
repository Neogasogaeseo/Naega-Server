const _ = require('lodash');
const convertSnakeToCamel = require('../lib/convertSnakeToCamel');

const getAllFormRecent = async (client) => {
  const { rows } = await client.query(
    `
    SELECT f.id, f.title, f.subtitle,
    f.is_new, f.is_banner, f.light_icon_image,
    c.code as color_code
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
    f.is_new, f.is_banner, f.light_icon_image,
    c.code as color_code
    FROM "form" f
    JOIN (SELECT form_id, COUNT(*) cnt
      FROM "link_user_form"
      GROUP BY form_id) l
    ON f.id = l.form_id
    JOIN "color" c
    ON c.id = f.color_id
    WHERE f.is_deleted = false
    ORDER BY l.cnt DESC
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

const getForm = async (client, userId, formId) => {
  const { rows } = await client.query (
    `
    SELECT l.user_id, l.form_id, f.title, f.subtitle, f.light_icon_image
    FROM link_user_form l 
    JOIN form f ON l.form_id = f.id
    WHERE l.user_id = $1
      AND l.form_id = $2
      AND l.is_deleted = false
      AND f.is_deleted = false
    `,

    [userId, formId],
  );
  return convertSnakeToCamel.keysToCamel(rows[0]);
};

module.exports = { getAllFormRecent, getAllFormPopular, getFormIsCreatedByUserId, getForm, };
