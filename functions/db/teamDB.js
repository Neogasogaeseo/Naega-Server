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

const addTeam = async (client, name, image, description) => {
    const { rows } = await client.query(
        `
        INSERT INTO team
        ("name", image, description)
        VALUES 
        ($1, $2, $3)
        RETURNING *
        `,
        [name, image, description]
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
    const valuesQuery = (userIdList.map(x=>`(${teamId}, ${x})`)).join(', ')
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

const checkMemberTeam = async (client, userId, teamId) => {
  const { rows } = await client.query (
    /*sql*/`
    SELECT m.team_id, m.user_id    
    FROM "member" m
    WHERE m.user_id = $1
      AND m.team_id = $2
      AND is_deleted = false
    `,

    [userId, teamId],
  );
  return convertSnakeToCamel.keysToCamel(rows[0]);
};

const updateTeam = async (client, teamId, teamName, description, image) => {
  const { rows } = await client.query (
    `
    UPDATE team t
    SET name = $1, description = $2, image = $3
    WHERE id = $4
    RETURNING *
    `,

    [teamName, description, image, teamId],
  );
  return convertSnakeToCamel.keysToCamel(rows[0]);
};

module.exports = { addTeam, addHostMember, addMember, getTeamById, getMemberByTeamId, checkMemberTeam, updateTeam,  };

