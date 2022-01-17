const _ = require('lodash');
const convertSnakeToCamel = require('../lib/convertSnakeToCamel');

const addFeedback = async (client, issueId, userid, taggedUserId, content) => {
  const { rows } = await client.query(
    /*sql*/ `
    INSERT INTO feedback
    (issue_id, user_id, tagged_user_id, content)
    VALUES 
    ($1, $2, $3, $4)
    RETURNING *
        `,
    [issueId, userid, taggedUserId, content],
  );
  return convertSnakeToCamel.keysToCamel(rows[0]);
};

const getFeedbacks = async (client, issueId) => {
  const { rows } = await client.query(/*sql*/ `
    SELECT f.id, f.issue_id, f.user_id, u.name as "name", f.tagged_user_id, tag.name as taggedUserName , f.content, f.is_pinned
    FROM feedback f 
    JOIN "user" u ON f.user_id = u.id
    JOIN "user" tag ON f.tagged_user_id = tag.id
    WHERE issue_id = ${issueId}
    AND f.is_deleted = false
    `);
  return convertSnakeToCamel.keysToCamel(rows);
};
module.exports = { addFeedback, getFeedbacks };
