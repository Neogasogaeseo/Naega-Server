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

module.exports = { addFeedback };
