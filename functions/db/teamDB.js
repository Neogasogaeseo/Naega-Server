const _ = require('lodash');
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

const getMemberByTeamId = async (client, teamId) => {
  const { rows } = await client.query(
    `
      SELECT u.id, u.profile_id, u.image, u.name, m.is_host
      FROM "member" m JOIN "user" u
      ON m.user_id = u.id
      WHERE m.team_id = $1
      AND m.is_deleted = false
      AND u.is_deleted = false
      `,
    [teamId],
  );

  return convertSnakeToCamel.keysToCamel(rows);
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

const updateTeam = async (client, teamId, teamName, description, image) => {
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

module.exports = { addTeam, getTeamById, getMemberByTeamId, updateTeam, getNewTeamByUserId, getTeamListByProfileId };
