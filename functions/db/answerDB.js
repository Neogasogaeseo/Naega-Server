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

const getPinnedAnswerByProfileId = async (client, profileId) => {
    const { rows } = await client.query (
        `
        SELECT l.user_id, u.profile_id, a.id, r.name as relationship_name, a.name, a.content, a.created_at, a.is_pinned
        FROM answer a
        JOIN link_user_form l ON a.link_user_form_id = l.id
        JOIN "user" u ON l.user_id = u.id
        JOIN relationship r ON a.relationship_id = r.id
        WHERE u.profile_id = $1
            AND a.is_pinned = true
            AND a.is_deleted = false
            AND l.is_deleted = false
            AND u.is_deleted = false
        ORDER BY a.created_at DESC
        `,

        [profileId],
    );
    return convertSnakeToCamel.keysToCamel(rows);
}

module.exports = { getRelationship, addAnswer, getPinnedAnswerByProfileId, };