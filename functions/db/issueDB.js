const _ = require('lodash');
const convertSnakeToCamel = require('../lib/convertSnakeToCamel');

//^_^// 아직 최신순 정렬 안됨
const getIssueIdRecentListByUserId = async (client, userId) => {
  const { rows } = await client.query(
    `
    SELECT i.id
    FROM "issue" i, (SELECT issue_id
            FROM "feedback"
            WHERE is_deleted = false
            AND tagged_user_id = $1
            ORDER BY updated_at DESC
            ) as f
      WHERE f.issue_id = i.id
      AND i.is_deleted = false
      GROUP BY i.id
    `,
    [userId],
  );

  return convertSnakeToCamel.keysToCamel(rows);
};

//^_^// 아직 최신순 정렬 안됨
const getIssueIdRecentListByTeamId = async (client, teamId) => {
  const { rows } = await client.query(
    `
    SELECT i.id
    FROM "issue" i, (SELECT f.issue_id
            FROM "feedback" f
            WHERE f.is_deleted = false
            ORDER BY f.created_at DESC) f
      WHERE i.team_id = $1 
      AND f.issue_id = i.id
      AND i.is_deleted = false
      GROUP BY i.id
    `,
    [teamId],
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
    WHERE i.id in (${issueId.join(',')})
    AND i.is_deleted = false
    `,
  );

  return convertSnakeToCamel.keysToCamel(rows);
};

const getAllFeedbackPersonList = async (client, issueId) => {
  const { rows } = await client.query(
    `
        SELECT f.issue_id as id, uu.name, uu.image
        FROM feedback "f",
        (SELECT u.id, u.name, u.image
        FROM "user" u JOIN "feedback" f
        ON u.id = f.tagged_user_id
        WHERE f.issue_id in (${issueId.join(',')})
        AND f.is_deleted = false
        GROUP BY u.id) uu
        WHERE uu.id=f.tagged_user_id
        AND f.issue_id in (${issueId.join(',')})
        `,
  );
  return convertSnakeToCamel.keysToCamel(rows);
};

const getIssueCategoryList = async (client) => {
  const { rows } = await client.query(
    /*sql*/`
    SELECT *
    FROM category
  `,
  );
  return convertSnakeToCamel.keysToCamel(rows);
};

/**오늘의 한마디..
const addIssue = async (client) => {

}
*/

module.exports = { getIssueIdRecentListByUserId, getIssueIdRecentListByTeamId, getIssueByIssueId, getAllFeedbackPersonList, getIssueCategoryList };

