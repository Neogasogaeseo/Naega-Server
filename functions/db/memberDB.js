const _ = require('lodash');
const convertSnakeToCamel = require('../lib/convertSnakeToCamel');

const getAllTeamByUserId = async (client, userId) => {
  const { rows } = await client.query(
    `
    SELECT t.id, t.name, t.image
    FROM "team" t, (SELECT team_id
        FROM "member" m
        WHERE user_id = $1 and is_confirmed = true) m
    WHERE t.id = m.team_id
    AND t.is_deleted = false;
    `,
    [userId],
  );

  return convertSnakeToCamel.keysToCamel(rows);
};

const addMemberToTeam = async (client, userId, teamId) => {
  const { rows } = await client.query(
    `
    INSERT INTO "member"
    (user_id, team_id, is_confirmed)
    VALUES
    ($1, $2, true)
    `,
    [userId, teamId],
  );
  return convertSnakeToCamel.keysToCamel(rows[0]);
};

module.exports = { getAllTeamByUserId, addMemberToTeam };
