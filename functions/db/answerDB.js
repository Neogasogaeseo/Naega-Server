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

const addAnswer = async (client, userId, formId, name, relationshipId, content) => {
    //^_^// 링크 테이블의 id 가져오기
    const { rows: linkRows } = await client.query (
        `
        SELECT id 
        FROM link_user_form 
        WHERE form_id = $1
            AND user_id = $2
            AND is_deleted = false
        `,

        [formId, userId],
    );
    if (linkRows.length === 0) return null;

    const linkUserFormId = linkRows[0].id;

    //^_^// answer테이블에 insert하기
    const { rows } = await client.query (
        `
        INSERT INTO answer
        (link_user_form_id, name, relationship_id, content)
        VALUES
        ($1, $2, $3, $4)
        RETURNING *
        `,

        [linkUserFormId, name, relationshipId, content],
    );
    console.log(rows[0]);
    return convertSnakeToCamel.keysToCamel(rows[0]);
};

module.exports = { getRelationship, addAnswer, };
