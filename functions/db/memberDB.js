const _ = require('lodash');
const convertSnakeToCamel = require('../lib/convertSnakeToCamel');

const getAllTeamByUserId = async (client, userId) => {
  const { rows } = await client.query(
    /*sql*/ `
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

const getAllTeamMemberByTeamId = async (client, teamId) => {
  const { rows } = await client.query(
    /*sql*/ `
    SELECT u.id, u.name, u.image
    FROM member m
    JOIN "user" u ON u.id = m.user_id
    WHERE m.team_id = $1
    AND m.is_deleted = FALSE
    AND u.is_deleted = FALSE
    `,
    [teamId],
  );

  return convertSnakeToCamel.keysToCamel(rows);
};

module.exports = { getAllTeamByUserId,addMemberToTeam, getAllTeamMemberByTeamId };
