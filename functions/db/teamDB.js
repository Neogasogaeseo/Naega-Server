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
      SELECT u.id, u.image, u.name
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

const addHostMember = async (client, teamId, userId) => {
  const { rows } = await client.query(
    `
        INSERT INTO member
        (team_id, user_id, is_confirmed, is_host)
        VALUES 
        ($1, $2, true, true)
        RETURNING *
        `,

    [teamId, userId],
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
    ORDER BY m.updated_at ASC
    `,
    [userId],
  );

  return convertSnakeToCamel.keysToCamel(rows);
};
module.exports = { addTeam, addHostMember, getTeamById, getMemberByTeamId, updateTeam, getNewTeamByUserId };
