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

// const getAnswers = async (client, formId) => {
//     const { rows } = await client.query(/*sql*/ `
//       SELECT a.id, a.form_id, a.user_id, u.name as "name", f.tagged_user_id, tag.name as taggedUserName , f.content,f.created_at, f.is_pinned
//       FROM (SELECT * FROM answer JOIN link_user_form ON answer.link_user_form_id = link_user_form.id) a
//       JOIN "user" u ON f.user_id = u.id
//       JOIN "user" tag ON f.tagged_user_id = tag.id
//       WHERE issue_id = ${formId}
//       AND f.is_deleted = false
//       `);
//     return convertSnakeToCamel.keysToCamel(rows);
//   };

module.exports = { getRelationship };
