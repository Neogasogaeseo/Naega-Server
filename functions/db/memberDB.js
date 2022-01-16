const _ = require('lodash');
const convertSnakeToCamel = require('../lib/convertSnakeToCamel');

const getAllTeamByUserId = async (client, userId) => {
  const { rows } = await client.query(
    /*sql*/ `
    SELECT t.id, t.name, t.image
    FROM "team" t, (SELECT team_id
        FROM "member" m
        WHERE user_id = $1 and is_confirmed = true
        AND is_deleted = false) m
    WHERE t.id = m.team_id
    AND t.is_deleted = false
    ORDER BY t.updated_at DESC
    `,
    [userId],
  );

  return convertSnakeToCamel.keysToCamel(rows);
};

const updateMemberAccept = async (client, userId, teamId) => {
  const { rows } = await client.query(
    `
    UPDATE member
    SET is_confirmed = true
    WHERE user_id = $1
    AND team_id = $2
    RETURNING *
    `,
    [userId, teamId],
  );
  return convertSnakeToCamel.keysToCamel(rows[0]);
};

const updateMemberReject = async (client, userId, teamId) => {
  const { rows } = await client.query(
    `
    UPDATE member
    SET is_deleted = true
    WHERE user_id = $1
    AND team_id = $2
    RETURNING *
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


//^_^// 팀에 멤버를 추가하는 쿼리
const addMember = async (client, teamId, userIdList) => {
  if(!userIdList) {
    return [];
  };

  const valuesInsertQuery = userIdList.map((x) => `(${teamId}, ${x})`).join(', ');
  const { rows: resultRows } = await client.query(
    `
        INSERT INTO member
        (team_id, user_id)
        VALUES 
        ${valuesInsertQuery}
        RETURNING *
        `,
  );
  return convertSnakeToCamel.keysToCamel(resultRows);
};

//^_^// 해당 멤버가 팀의 host인지 확인하는 과정
const checkMemberHost = async (client, userId, teamId) => {
  const { rows } = await client.query (
    `
    SELECT m.team_id, m.user_id    
    FROM "member" m
    WHERE m.user_id = $1
      AND m.team_id = $2
      AND is_host = true
      AND is_deleted = false
    `,

    [userId, teamId],
  );

  return convertSnakeToCamel.keysToCamel(rows[0]);
};

module.exports = { getAllTeamByUserId,addMemberToTeam, getAllTeamMemberByTeamId, addMember, checkMemberHost, updateMemberAccept, updateMemberReject};

