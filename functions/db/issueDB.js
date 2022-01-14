const _ = require('lodash');
const convertSnakeToCamel = require('../lib/convertSnakeToCamel');

const getIssueIdRecentListByUserId = async (client, userId) => {
  const { rows } = await client.query(
    `
    SELECT i.id
    FROM "issue" i, (SELECT f.issue_id
            FROM "feedback" f
            WHERE f.is_deleted = false
            ORDER BY f.created_at DESC) f
      WHERE user_id = $1 
      AND f.issue_id = i.id
      AND i.is_deleted = false
      GROUP BY i.id
    `,
    [userId],
  );

  return convertSnakeToCamel.keysToCamel(rows);
};

const getIssueByIssueId = async (client, issueId) => {
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
    WHERE i.id = $1
    AND i.is_deleted = false
    `,
    [issueId],
  );

  return convertSnakeToCamel.keysToCamel(rows[0]);
};

const getAllFeedbackPersonList = async (client, userId, issueId) => {
  const { rows } = await client.query(
    `
        SELECT u.name, u.image
        FROM "user" u JOIN "feedback" f
        ON u.id = f.user_id
        WHERE f.tagged_user_id = $1
        AND f.issue_id = $2
        AND f.is_deleted = false
        `,
    [userId, issueId],
  );
  return convertSnakeToCamel.keysToCamel(rows);
};

module.exports = { getIssueIdRecentListByUserId, getIssueByIssueId, getAllFeedbackPersonList };
