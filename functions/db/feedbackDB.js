const _ = require('lodash');
const convertSnakeToCamel = require('../lib/convertSnakeToCamel');
const arrayHandler = require('../lib/arrayHandler');

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
    SELECT f.id, f.issue_id, f.user_id, u.name as "name", f.tagged_user_id, tag.name as taggedUserName , f.content,f.created_at, f.is_pinned
    FROM feedback f 
    JOIN "user" u ON f.user_id = u.id
    JOIN "user" tag ON f.tagged_user_id = tag.id
    WHERE issue_id = ${issueId}
    AND f.is_deleted = false
    `);
  return convertSnakeToCamel.keysToCamel(rows);
};

const getFeedbackById = async (client, feedbackId) => {
  const { rows } = await client.query(/*sql*/ `
    SELECT *
    FROM feedback 
    WHERE id = ${feedbackId}
    AND feedback.is_deleted = false
    `);
  return convertSnakeToCamel.keysToCamel(rows[0]);
};

const editFeedback = async (client, feedbackId, taggedUserId, content) => {
  const { rows } = await client.query(/*sql*/ `
    UPDATE feedback
    SET tagged_user_id = ${taggedUserId}, content = '${content}', updated_at = now()
    WHERE id = ${feedbackId}
    AND is_deleted = false
    RETURNING *
        `);
  return convertSnakeToCamel.keysToCamel(rows[0]);
};

const toggleIsPinnedFeedback = async (client, feedbackId) => {
  const { rows } = await client.query(/*sql*/ `
  UPDATE feedback
  SET is_pinned = NOT is_pinned, updated_at = now()
  WHERE id = ${feedbackId}
  AND is_deleted = false
  RETURNING feedback.id, feedback.is_pinned
  `);
  return convertSnakeToCamel.keysToCamel(rows[0]);
};

const getPinnedFeedbackByProfileId = async (client, profileId) => {
  const { rows } = await client.query(
    /*sql*/ `
    SELECT u.id, u.profile_id, u.name, f.id as feedback_id, f.user_id as writer_user_id, writer.name as writer_name, f.content, f.created_at, f.is_pinned
    FROM feedback f
    JOIN "user" u ON f.tagged_user_id = u.id
    JOIN "user" writer ON f.user_id = writer.id
    WHERE u.profile_id = $1
      AND f.is_pinned = true
      AND u.is_deleted = false
      AND f.is_deleted = false
    ORDER BY f.created_at DESC
    `,

    [profileId],
  );
  return convertSnakeToCamel.keysToCamel(rows);
};

const getAllFeedbackByUserId = async (client, userId, offset, limit) => {
  const { rows } = await client.query(
    `
    SELECT f.id as feedback_id, t.id as team_id, 
      f.user_id as writer_user_id, u2.name as writer_user_name, 
      f.tagged_user_id as user_id, u.name as user_name, 
      f.created_at, f.content, f.is_pinned,
      i.id as issue_id, i.content as issue_content
    FROM feedback f
    JOIN "user" u ON u.id = f.tagged_user_id
    JOIN "user" u2 ON u2.id = f.user_id
    JOIN issue i ON f.issue_id = i.id
    JOIN team t ON i.team_id = t.id
    WHERE f.tagged_user_id = $1
      AND f.is_deleted = false
      AND u.is_deleted = false
      AND u2.is_deleted = false
      AND i.is_deleted = false
      AND t.is_deleted = false
    ORDER BY f.created_at DESC
    OFFSET $2 LIMIT $3
    `,
    [userId, offset, limit],
  );
  return convertSnakeToCamel.keysToCamel(rows);
};

const getFilteredFeedbackByFormId = async (client, userId, teamId, offset, limit) => {
  const { rows } = await client.query(
    `
    SELECT f.id as feedback_id, t.id as team_id, 
      f.user_id as writer_user_id, u2.name as writer_user_name,
      f.tagged_user_id as user_id, u.name as user_name,
      f.created_at, f.content, f.is_pinned,
      i.id as issue_id, i.content as issue_content
    FROM feedback f
    JOIN "user" u ON u.id = f.tagged_user_id
    JOIN "user" u2 ON u2.id = f.user_id
    JOIN issue i ON f.issue_id = i.id
    JOIN team t ON i.team_id = t.id
    WHERE f.tagged_user_id = $1
      AND t.id = $2
      AND f.is_deleted = false
      AND u.is_deleted = false
      AND u2.is_deleted = false
      AND i.is_deleted = false
      AND t.is_deleted = false
    ORDER BY f.created_at DESC
    OFFSET $3 LIMIT $4
    `,
    [userId, teamId, offset, limit],
  );
  return convertSnakeToCamel.keysToCamel(rows);
};

const deleteFeedback = async (client, feedbackId) => {
  const { rows } = await client.query(/*sql*/ `
    UPDATE feedback
  SET is_deleted = true, updated_at = now()
  WHERE id = ${feedbackId}
  AND is_deleted = false
  RETURNING *`);
  return convertSnakeToCamel.keysToCamel(rows[0]);
};

const deleteFeedbackList = async (client, feedbackIdList) => {
  const { rows } = await client.query(/*sql*/ `
    UPDATE feedback
  SET is_deleted = true, updated_at = now()
  WHERE id in (${feedbackIdList.join()})
  AND is_deleted = false
  RETURNING *`);
  return convertSnakeToCamel.keysToCamel(rows);
};

const getAllFeedbackByUserIdAndTeamId = async (client, userId, teamId) => {
  const { rows } = await client.query(
    `
    SELECT f.id as feedback_id, t.id as team_id, 
      f.user_id as writer_user_id, u2.name as writer_user_name, 
      f.tagged_user_id as user_id, u.name as user_name, 
      f.created_at, f.content, f.is_pinned
    FROM feedback f
    JOIN "user" u ON u.id = f.tagged_user_id
    JOIN "user" u2 ON u2.id = f.user_id
    JOIN issue i ON f.issue_id = i.id
    JOIN team t ON i.team_id = t.id
    WHERE t.id = $2
      AND (f.tagged_user_id = $1
          OR f.user_id = $1
          )
      AND f.is_deleted = false
      AND u.is_deleted = false
      AND u2.is_deleted = false
      AND i.is_deleted = false
      AND t.is_deleted = falsE
    `,
    [userId, teamId],
  );
  return convertSnakeToCamel.keysToCamel(rows);
};

const getAllFeedbackByUserIdAndTeamIds = async (client, userId, teamIds) => {
  const teamIdsForQuery = `(${teamIds.join(',')})`;
  const { rows } = await client.query(
    /*sql*/ `
    SELECT f.id as feedback_id, t.id as team_id, 
      f.user_id as writer_user_id, u2.name as writer_user_name, 
      f.tagged_user_id as user_id, u.name as user_name, 
      f.created_at, f.content, f.is_pinned
    FROM feedback f
    JOIN "user" u ON u.id = f.tagged_user_id
    JOIN "user" u2 ON u2.id = f.user_id
    JOIN issue i ON f.issue_id = i.id
    JOIN team t ON i.team_id = t.id
    WHERE t.id IN ${teamIdsForQuery}
      AND (f.tagged_user_id = $1
          OR f.user_id = $1
          )
      AND f.is_deleted = false
      AND u.is_deleted = false
      AND u2.is_deleted = false
      AND i.is_deleted = false
      AND t.is_deleted = falsE
    `,
    [userId],
  );

  const result = arrayHandler.extractValues(rows, 'id');
  return convertSnakeToCamel.keysToCamel(result);
};

const getAllFeedbackByIssueIdList = async (client, issueIdList) => {
  const { rows } = await client.query(/*sql*/ `
    SELECT f.id
    FROM feedback f
    WHERE f.issue_id in (${issueIdList.join()})
      AND f.is_deleted = false
    `);
  return convertSnakeToCamel.keysToCamel(rows);
};

const getAllFeedbackIdsByIssueIdList = async (client, issueIdList) => {
  const { rows } = await client.query(/*sql*/ `
    SELECT f.id
    FROM feedback f
    WHERE f.issue_id in (${issueIdList.join()})
      AND f.is_deleted = false
    `);
  return convertSnakeToCamel.keysToCamel(rows);
};

module.exports = {
  addFeedback,
  getFeedbacks,
  toggleIsPinnedFeedback,
  getPinnedFeedbackByProfileId,
  getAllFeedbackByUserId,
  getFilteredFeedbackByFormId,
  deleteFeedback,
  getFeedbackById,
  editFeedback,
  deleteFeedbackList,
  getAllFeedbackByUserIdAndTeamId,
  getAllFeedbackByIssueIdList,
  getAllFeedbackByUserIdAndTeamIds,
  getAllFeedbackIdsByIssueIdList,
};
