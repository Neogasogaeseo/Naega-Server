const _ = require('lodash');
const convertSnakeToCamel = require('../lib/convertSnakeToCamel');

const getAllIssueByUserId = async (client, userId) => {
  const { rows } = await client.query(
    `
    SELECT i.id, c.name as category_name, i.created_at, i.content,
    t.name as team_name, u.name as user_name
    FROM "issue" i JOIN "category" c
    ON i.category_id = c.id
    JOIN "team" t
    ON i.team_id = t.id
    JOIN "user" u
    ON i.user_id = u.id
    WHERE i.user_id = $1
    `,
    [userId],
  );

  return convertSnakeToCamel.keysToCamel(rows);
};

const getAllFeedbackPersonList = async (client, userId, issueId) => {
  const { rows } = await client.query(
    `
        SELECT u.name, u.image
        FROM "user" u JOIN "feedback" f
        ON u.id = f.user_id
        WHERE f.tagged_user_id = $1
        AND f.issue_id = $2
        `,
    [userId, issueId],
  );
  return convertSnakeToCamel.keysToCamel(rows);
};

module.exports = { getAllIssueByUserId, getAllFeedbackPersonList };
