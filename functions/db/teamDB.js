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

const addMember = async (client, teamId, userIdList) => {
  const valuesQuery = userIdList.map((x) => `(${teamId}, ${x})`).join(', ');
  const { rows } = await client.query(
    `
        INSERT INTO member
        (team_id, user_id)
        VALUES 
        ${valuesQuery}
        RETURNING *
        `,
  );
  return convertSnakeToCamel.keysToCamel(rows);
};

module.exports = { addTeam, addHostMember, addMember, getTeamById, getMemberByTeamId };
