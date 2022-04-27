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

const deleteFeedback = async (client, feedbackId) => {
  const { rows } = await client.query(/*sql*/ `
    UPDATE feedback
  SET is_deleted = true, updated_at = now()
  WHERE id = ${feedbackId}
  AND is_deleted = false
  RETURNING *`);
  return convertSnakeToCamel.keysToCamel(rows[0]);
};

module.exports = { addFeedback, getFeedbacks, getFeedbackById, editFeedback, toggleIsPinnedFeedback, getPinnedFeedbackByProfileId, deleteFeedback };
