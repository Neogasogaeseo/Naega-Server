const _ = require('lodash');
const convertSnakeToCamel = require('../lib/convertSnakeToCamel');

const getAllTeamByUserId = async (client, userId) => {
  const { rows } = await client.query(
    `
    SELECT t.id, t.name, t.image
    FROM "team" t, (SELECT team_id
        FROM "member" m
        WHERE user_id = $1 and is_confirmed = true
        and is_deleted = false) m
    WHERE t.id = m.team_id;
    `,
    [userId],
  );

  return convertSnakeToCamel.keysToCamel(rows);
};

module.exports = { getAllTeamByUserId };