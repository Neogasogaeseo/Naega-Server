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
    SET is_confirmed = true, updated_at = NOW()
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
    SET is_deleted = true, updated_at = NOW()
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
    SELECT u.id, u.name, u.profile_id, u.image, m.is_confirmed, m.is_host
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

  const valuesInsertQuery = userIdList
    .map((x) => `(${teamId}, ${x})`)
    .join(', ');
  console.log(valuesInsertQuery);
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
      AND is_confirmed = true
    `,

    [userId, teamId],
  );

  return convertSnakeToCamel.keysToCamel(rows[0]);
};

const deleteMember = async (client, userId, teamId) => {
  const { rows } = await client.query(
    `
    UPDATE member
    SET is_deleted = true, is_confirmed = false,
    updated_at = NOW()
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
    SET is_host = false, is_deleted = true, 
    is_confirmed = false, updated_at = NOW()
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
    SET is_host = true, updated_at = NOW()
    WHERE user_id = $1
    AND team_id = $2
    AND is_deleted = false
    RETURNING *
    `,

    [memberId, teamId],
  );

  return convertSnakeToCamel.keysToCamel(rows[0]);
};

const getInvitedTeamIdList = async (client, userId, offset, limit) => {
  const { rows } = await client.query(
    `
    SELECT m.team_id, m.is_confirmed, m.is_deleted, m.updated_at
    FROM "member" m
    WHERE m.user_id = $1
    ORDER BY updated_at DESC
    LIMIT $3 OFFSET $2
    `,
    [userId, offset, limit],
  );

  return convertSnakeToCamel.keysToCamel(rows);
};

const getAllInvitedTeamIdList = async (client, userId) => {
  const { rows } = await client.query(
    `
    SELECT m.team_id, m.is_confirmed, m.is_deleted
    FROM "member" m
    WHERE m.user_id = $1
    ORDER BY updated_at DESC
    `,
    [userId],
  );

  return convertSnakeToCamel.keysToCamel(rows);
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
      AND m.is_confirmed = true
      ORDER BY m.is_host DESC
      `,
    [teamId],
  );

  return convertSnakeToCamel.keysToCamel(rows);
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
  getInvitedTeamIdList,
  getAllInvitedTeamIdList,
  getMemberByTeamId,
};
