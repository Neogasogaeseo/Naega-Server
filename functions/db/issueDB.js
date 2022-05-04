const _ = require('lodash');
const convertSnakeToCamel = require('../lib/convertSnakeToCamel');

const getFeedbackIdRecentListByUserId = async (client, userId) => {
  const { rows } = await client.query(
    `
    SELECT f.id, f.issue_id
    FROM "feedback" f
    WHERE f.tagged_user_id = $1
    AND f.is_deleted = false
    ORDER BY updated_at
    `,
    [userId],
  );

  return convertSnakeToCamel.keysToCamel(rows);
};

const getIssueIdRecentListByTeamId = async (client, teamId) => {
  const { rows } = await client.query(
    `
    SELECT i.id
    FROM "issue" i 
    WHERE i.team_id = $1 
    AND i.is_deleted = false
    ORDER BY i.updated_at DESC
    `,

    [teamId],
  );

  return convertSnakeToCamel.keysToCamel(rows);
};

const getIssueIdRecentListByTeamIdAndUserId = async (client, teamId, userId) => {
  const { rows } = await client.query(
    `
    SELECT i.id
    FROM "issue" i 
    JOIN "feedback" f
    ON i.id = f.issue_id 
    WHERE i.team_id = $1
    AND f.tagged_user_id = $2
    AND i.is_deleted = false
    ORDER BY i.updated_at DESC
    `,

    [teamId, userId],
  );

  return convertSnakeToCamel.keysToCamel(rows);
};

const getIssueByIssueId = async (client, issueId) => {
  const { rows } = await client.query(
    `
    SELECT i.id, i.image, c.name as category_name, i.created_at, i.content
    FROM "issue" i JOIN "category" c
    ON i.category_id = c.id
    WHERE i.id in (${issueId.join(',')})
    AND i.is_deleted = false
    `,
  );

  return convertSnakeToCamel.keysToCamel(rows);
};

const getIssueDetailByIssueId = async (client, issueId) => {
  const { rows } = await client.query(
    `
    SELECT i.id, i.user_id, u.name as user_name, i.image, c.name as category_name, i.created_at, i.content
    FROM "issue" i 
    JOIN "category" c
    ON i.category_id = c.id
    JOIN "user" u 
    ON u.id = i.user_id
    WHERE i.id = ${issueId}
    AND i.is_deleted = false
    `,
  );

  return convertSnakeToCamel.keysToCamel(rows[0]);
};

const getTeamByIssueId = async (client, issueId) => {
  const { rows } = await client.query(
    `
    SELECT i.id as issue_id, t.id, t.name, t.image,
    u.name as user_name
    FROM "issue" i JOIN "team" t
    ON i.team_id = t.id    
    JOIN "user" u
    ON i.user_id = u.id
    WHERE t.is_deleted = false
    AND i.id in (${issueId.join(',')})

    `,
  );
  return convertSnakeToCamel.keysToCamel(rows);
};

const getAllFeedbackPersonList = async (client, issueId) => {
  const { rows } = await client.query(
    `
    SELECT f.issue_id, uu.id , uu.name, uu.image
    FROM feedback "f",
    (SELECT u.id, u.name, u.image
    FROM "user" u JOIN "feedback" f
    ON u.id = f.tagged_user_id
    WHERE f.is_deleted = false
    GROUP BY u.id) uu
    WHERE uu.id=f.tagged_user_id
    AND f.issue_id in (${issueId.join(',')})
    `,
  );
  return convertSnakeToCamel.keysToCamel(rows);
};

const getIssueCategoryList = async (client) => {
  const { rows } = await client.query(`
    SELECT *
    FROM category
  `);
  return convertSnakeToCamel.keysToCamel(rows);
};

const addIssue = async (client, userId, teamId, categoryId, content, image) => {
  const { rows } = await client.query(
    /*sql*/ `
    INSERT INTO issue
    (team_id, user_id, category_id, content, "image")
    VALUES
    ($1, $2, $3, $4, $5)
    RETURNING *
    `,

    [teamId, userId, categoryId, content, image],
  );
  return convertSnakeToCamel.keysToCamel(rows[0]);
};

const getTeamForIssueDetailByIssueId = async (client, issueId) => {
  const { rows } = await client.query(
    `
    SELECT t.image, t.name
    FROM issue i
    JOIN "team" t
    ON i.team_id = t.id
    WHERE i.id = ${issueId}
    AND i.is_deleted = false
    `,
  );

  return convertSnakeToCamel.keysToCamel(rows[0]);
};

const checkIssueUserId = async (client, issueId) => {
  const { rows } = await client.query(
    `
    SELECT user_id
    FROM issue
    WHERE id = ${issueId}
    AND is_deleted = false
    `,
  );

  return convertSnakeToCamel.keysToCamel(rows[0]);
};

const updateIssue = async (client, issueId, categoryId, content, image) => {
  const { rows } = await client.query(
    `
    UPDATE issue
    SET category_id = $2, content = $3, image = $, updated_at = now()
    WHERE id = $1
    RETURNING *
    `,

    [issueId, categoryId, content, image],
  );
  return convertSnakeToCamel.keysToCamel(rows[0]);
};

const deleteIssue = async (client, issueId) => {
  const { rows } = await client.query(
    `
    UPDATE issue
    SET is_deleted = true
    WHERE id = ${issueId}
    RETURNING *
    `,
  );
  return convertSnakeToCamel.keysToCamel(rows[0]);
};

module.exports = {
  getFeedbackIdRecentListByUserId,
  getIssueIdRecentListByTeamId,
  getIssueIdRecentListByTeamIdAndUserId,
  getIssueByIssueId,
  getIssueDetailByIssueId,
  getTeamByIssueId,
  getAllFeedbackPersonList,
  getIssueCategoryList,
  addIssue,
  getTeamForIssueDetailByIssueId,
  checkIssueUserId,
  updateIssue,
  deleteIssue,
};
