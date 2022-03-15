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

//^_^// 팀에 멤버를 추가하는 쿼리
const addMember = async (client, teamId, userIdList) => {
  if (!userIdList) {
    return [];
  }

  const valuesInsertQuery = JSON.parse(userIdList)
    .map((x) => `(${teamId}, ${x})`)
    .join(', ');
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
  const { rows } = await client.query(
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

//^_^// 유저가 해당 팀의 멤버인지 확인하는 쿼리
const checkMemberTeam = async (client, userId, teamId) => {
  const { rows } = await client.query(
    `
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

const deleteMember = async (client, userId, teamId) => {
  const { rows } = await client.query(
    `
    UPDATE member
    SET is_deleted = true, is_confirmed = false
    WHERE user_id = $1
    AND team_id = $2
    RETURNING *
    `,

    [userId, teamId],
  );

  return convertSnakeToCamel.keysToCamel(rows[0]);
};

const updateOldHost = async (client, userId, teamId) => {
  const { rows } = await client.query(
    `
    UPDATE member
    SET is_host = false, is_deleted = true, is_confirmed = false
    WHERE user_id = $1
    AND team_id = $2
    AND is_deleted = false
    RETURNING *
    `,

    [userId, teamId],
  );

  return convertSnakeToCamel.keysToCamel(rows[0]);
};

const updateNewHost = async (client, memberId, teamId) => {
  const { rows } = await client.query(
    `
    UPDATE member
    SET is_host = true
    WHERE user_id = $1
    AND team_id = $2
    AND is_deleted = false
    RETURNING *
    `,

    [memberId, teamId],
  );

  return convertSnakeToCamel.keysToCamel(rows[0]);
};

module.exports = {
  getAllTeamByUserId,
  getAllTeamMemberByTeamId,
  addMember,
  checkMemberHost,
  updateMemberAccept,
  updateMemberReject,
  addHostMember,
  checkMemberTeam,
  deleteMember,
  updateOldHost,
  updateNewHost,
};
