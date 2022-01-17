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
<<<<<<< HEAD
    SELECT f.id, f.issue_id, f.user_id, f.tagged_user_id, f.content, f.is_pinned
    FROM feedback f 
    WHERE issue_id = ${issueId}
    AND is_deleted = false
    `);
  return convertSnakeToCamel.keysToCamel(rows);
=======
    SELECT feedback.*
    FROM feedback
    WHERE issue_id = ${issueId}
    `);
  return convertSnakeToCamel.keysToCamel(rows[0]);
>>>>>>> 08cfa28e4cee748a5e68d6bf896ad4f8c8fc9200
};
module.exports = { addFeedback, getFeedbacks };
