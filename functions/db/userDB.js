const _ = require('lodash');
const convertSnakeToCamel = require('../lib/convertSnakeToCamel');

const checkUserProfileId = async (client, profileId) => {
  const { rows } = await client.query(
    `
      SELECT * FROM "user"
      WHERE profile_id = $1
      AND is_deleted = false
    `,
    [profileId],
  );
  return convertSnakeToCamel.keysToCamel(rows[0]);
};

const addUser = async (client, profileId, name, authenticationCode, provider) => {
  const { rows } = await client.query(
    `
        INSERT INTO "user"
        (profile_id, name, authentication_code, provider)
        VALUES
        ($1, $2, $3, $4)
        RETURNING *
        `,

    [profileId, name, authenticationCode, provider],
  );
  return convertSnakeToCamel.keysToCamel(rows[0]);
};

const getUserByAuthenticationCode = async (client, authenticationCode) => {
  const { rows } = await client.query(
    `
        SELECT * FROM "user" u
        WHERE authentication_code = $1
          AND is_deleted = FALSE
        `,
    [authenticationCode],
  );
  return convertSnakeToCamel.keysToCamel(rows[0]);
};

const updateRefreshTokenById = async (client, id, refreshToken) => {
  const { rows: existingRows } = await client.query(
    `
          SELECT * FROM "user"
          WHERE id = $1
             AND is_deleted = FALSE
          `,
    [id],
  );

  if (existingRows.length === 0) return false;

  const data = _.merge({}, convertSnakeToCamel.keysToCamel(existingRows[0]), {
    refreshToken,
  });
  const { rows } = await client.query(
    `
        UPDATE "user" u
        SET refresh_token = $2
        WHERE id = $1
        RETURNING *   
    `,
    [id, data.refreshToken],
  );
  return convertSnakeToCamel.keysToCamel(rows[0]);
};

const getUserById = async (client, userId) => {
  const { rows } = await client.query(
    `
      SELECT * FROM "user" u
      WHERE id = $1
        AND is_deleted = FALSE
      `,
    [userId],
  );
  return convertSnakeToCamel.keysToCamel(rows[0]);
};

const getUserListByProfileId = async (client, profileId, teamId) => {
  //^_^// 해당 팀에 존재하는 멤버 정보를 가져오는 쿼리
  const { rows: existMemberRows } = await client.query(
    `
    SELECT u.profile_id
    FROM "user" u JOIN member
      ON u.id = member.user_id
    WHERE member.team_id = ${teamId}
    `,
  );
  console.log(existMemberRows);

  const profileIdSet = '(' + existMemberRows.map((o) => `'${o.profile_id}'`).join(', ') + ')';
  console.log(profileIdSet);

  //^_^// 해당 팀에 존재하지 않고, 삭제되지 않은 유저 검색 결과 가져오는 쿼리
  const { rows } = await client.query(
    `
    SELECT u.id, u.profile_id, u.name, u.image
    FROM "user" u
    WHERE profile_id = $1
      AND is_deleted = FALSE
      AND u.profile_id NOT IN ${profileIdSet}
    `,

    [profileId],
  );
  if (!rows) {
    return null;
  }
  return convertSnakeToCamel.keysToCamel(rows);
};

module.exports = { checkUserProfileId, addUser, getUserByAuthenticationCode, updateRefreshTokenById, getUserById, getUserListByProfileId };
