const _ = require('lodash');
const convertSnakeToCamel = require('../lib/convertSnakeToCamel');

const getTeamById = async (client, teamId) => {
  const { rows } = await client.query(
    `
    SELECT t.image, t.name, t.description 
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
      SELECT u.image, u.name
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

module.exports = { getTeamById, getMemberByTeamId };
