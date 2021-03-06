const _ = require('lodash');
const { ClientBase } = require('pg');
const convertSnakeToCamel = require('../lib/convertSnakeToCamel');

const getTeamById = async (client, teamId) => {
  const { rows } = await client.query(
    `
    SELECT t.id, t.image, t.name, t.description 
    FROM "team" t
    WHERE t.id = $1
    AND t.is_deleted = false
    `,
    [teamId],
  );

  return convertSnakeToCamel.keysToCamel(rows[0]);
};

const addTeam = async (client, name, image, description) => {
  const { rows } = await client.query(
    `
        INSERT INTO team
        ("name", image, description)
        VALUES 
        ($1, $2, $3)
        RETURNING *
        `,
    [name, image, description],
  );
  return convertSnakeToCamel.keysToCamel(rows[0]);
};

const updateTeamWithoutImage = async (client, teamId, teamName, description) => {
  const { rows } = await client.query(
    `
    UPDATE team t
    SET name = $1, description = $2, updated_at = now()
    WHERE id = $3
    RETURNING *
    `,
    [teamName, description, teamId],
  );
  return convertSnakeToCamel.keysToCamel(rows[0]);
};

const updateTeamIncludeImage = async (client, teamId, teamName, description, image) => {
  const { rows } = await client.query(
    `
    UPDATE team t
    SET name = $1, description = $2, image = $3, updated_at = now()
    WHERE id = $4
    RETURNING *
    `,

    [teamName, description, image, teamId],
  );
  return convertSnakeToCamel.keysToCamel(rows[0]);
};

const getNewTeamByUserId = async (client, userId) => {
  const { rows } = await client.query(
    `
    SELECT t.id, t.image, t.name, t.description 
    FROM "team" t
    JOIN "member" m
    ON t.id = m.team_id
    WHERE m.user_id = $1
    AND t.is_deleted = false
    AND m.is_confirmed = false
    AND m.is_deleted = false
    ORDER BY m.updated_at DESC
    LIMIT 1;
    `,
    [userId],
  );

  return convertSnakeToCamel.keysToCamel(rows);
};

const getTeamListByProfileId = async (client, profileId) => {
  const { rows } = await client.query(
    `
    SELECT t.id, t.name, t.image, t.is_deleted
    FROM "user" u
    JOIN member m ON u.id = m.user_id
    JOIN team t ON t.id = m.team_id
    WHERE u.profile_id = $1
      AND u.is_deleted = false
      AND m.is_confirmed = true
      AND m.is_deleted = false
      AND t.is_deleted = false
    `,

    [profileId],
  );
  return convertSnakeToCamel.keysToCamel(rows);
};

const getIsHost = async (client, userId, teamId) => {
  const { rows } = await client.query(
    `
    SELECT m.is_host
    FROM "member" m
    WHERE m.user_id = $1
    AND m.team_id = $2
    `,

    [userId, teamId],
  );
  return convertSnakeToCamel.keysToCamel(rows[0]);
};

const deleteTeam = async (client, teamId) => {
  const { rows } = await client.query(
    `
    UPDATE team
    SET is_deleted = true, updated_at = NOW()
    WHERE id = $1
    RETURNING *
    `,
    [teamId],
  );
  return convertSnakeToCamel.keysToCamel(rows[0]);
};

const getTeamListByTeamIdList = async (client, teamIdList) => {
  const { rows } = await client.query(
    `
    SELECT t.id, t.name, t.image, t.is_deleted
    FROM "team" t
    WHERE t.id in (${teamIdList})
    `,
  );
  return convertSnakeToCamel.keysToCamel(rows);
};

const getTeamListByUserId = async (client, userId) => {
  const { rows } = await client.query(
    `
    SELECT t.id, t.name, t.image, t.is_deleted
    FROM team t
    JOIN member m ON m.team_id = t.id
    WHERE m.user_id = $1
      AND m.is_confirmed = true
      AND m.is_deleted = false
      AND t.is_deleted = false
    `,
    [userId],
  );
  return convertSnakeToCamel.keysToCamel(rows);
};

const getTeamWithInvitation = async (client, userId, teamId) => {
  const { rows } = await client.query(
    `
    SELECT t.id, t.is_deleted
    FROM team t
    LEFT OUTER JOIN member m
    ON m.team_id = t.id
    WHERE m.user_id = $1
      AND t.id = $2
      AND m.is_confirmed = false
      AND m.is_deleted = false
    `,
    [userId, teamId],
  );
  return convertSnakeToCamel.keysToCamel(rows[0]);
};

module.exports = {
  addTeam,
  getTeamById,
  updateTeamWithoutImage,
  updateTeamIncludeImage,
  getNewTeamByUserId,
  getTeamListByProfileId,
  getIsHost,
  deleteTeam,
  getTeamListByTeamIdList,
  getTeamListByUserId,
  getTeamWithInvitation,
};
