const _ = require('lodash');
const convertSnakeToCamel = require('../lib/convertSnakeToCamel');

const getAllTeamByUserId = async (client, userId) => {
  const { rows } = await client.query(
    /*sql*/ `
    SELECT t.id, t.name, t.image, i.created_at, i.is_deleted
    FROM "team" t
    JOIN "member" m ON t.id = m.team_id
    LEFT OUTER JOIN "issue" i ON t.id = i.team_id 
    WHERE m.user_id = $1
        AND m.is_confirmed = true
        AND m.is_deleted = false
        -- AND i.is_deleted = false
        AND t.is_deleted = false
    ORDER BY i.created_at is null ASC, i.created_at DESC
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
    AND m.is_deleted = false
    AND u.is_deleted = false
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
  if (userIdList.length === 0) {
    return [];
  }

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
    SET is_deleted = true,
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
    AND m.is_host = false
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
    AND m.is_host = false
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

const checkDuplicateMember = async (client, teamId, userIdList) => {
  const valuesInsertQuery = '(' + userIdList.map((x) => `${x}`).join(', ') + ')';

  const { rows } = await client.query(
    `
    SELECT user_id
    FROM member m
    WHERE team_id = $1
      AND user_id in ${valuesInsertQuery}
      AND is_deleted = false 
    `,
    [teamId],
  );

  return convertSnakeToCamel.keysToCamel(rows);
};

const checkUserIsHost = async (client, userId) => {
  const { rows } = await client.query(
    `
      SELECT t.id, t.name, t.image
      FROM "member" m
      JOIN "team" t
      ON m.team_id = t.id
      WHERE m.user_id = $1
      AND m.is_confirmed = true
      AND m.is_deleted = false
      AND m.is_host = true
      AND t.is_deleted = false
      ORDER BY t.created_at DESC
      `,
    [userId],
  );

  return convertSnakeToCamel.keysToCamel(rows);
};

const deleteAllMemberByTeamId = async (client, teamId) => {
  const { rows } = await client.query(
    `
    UPDATE member
    SET is_deleted = true,
    updated_at = NOW()
    WHERE team_id = $1
    RETURNING *
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
  checkDuplicateMember,
  checkUserIsHost,
  deleteAllMemberByTeamId,
};
