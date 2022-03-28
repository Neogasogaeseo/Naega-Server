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

const gettaggedUserProfileId = async (client, taggedUserId) => {
  const { rows } = await client.query(
    `
      SELECT u.profile_id FROM "user" u
      WHERE u.id = $1
      AND is_deleted = false
    `,
    [taggedUserId],
  );
  return convertSnakeToCamel.keysToCamel(rows[0]);
};

const addUser = async (client, profileId, name, authenticationCode, provider, image) => {
  const { rows } = await client.query(
    `
        INSERT INTO "user"
        (profile_id, name, authentication_code, provider, image)
        VALUES
        ($1, $2, $3, $4, $5)
        RETURNING *
        `,

    [profileId, name, authenticationCode, provider, image],
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

const getUserListByProfileIdTeamId = async (client, profileId, userId, teamId, offset, limit) => {
  const { rows } = await client.query(
    `
    SELECT u.id, u.profile_id, u.name, u.image, m.is_confirmed
    FROM "user" u
    LEFT JOIN member m ON m.user_id = u.id
    WHERE profile_id ILIKE '%' || $1 || '%'
      AND u.id != $2
      AND (m.team_id = $3 OR m.team_id IS NULL)
      AND u.is_deleted = FALSE
      AND (m.is_deleted = FALSE OR m.is_deleted IS NULL)
    LIMIT $4 OFFSET $5
    `,

    [profileId, userId, teamId, limit, offset],
  );
  if (!rows) {
    return null;
  }
  return convertSnakeToCamel.keysToCamel(rows);
};

const getUserListByOnlyProfileId = async (client, profileId, userId, offset, limit) => {
  const { rows } = await client.query(
    `
    SELECT u.id, u.profile_id, u.name, u.image
    FROM "user" u
    WHERE profile_id ILIKE '%' || $1 || '%'
      AND id != $2
      AND is_deleted = FALSE
    LIMIT $3 OFFSET $4
    `,

    [profileId, userId, limit, offset],
  );
  return convertSnakeToCamel.keysToCamel(rows);
};

const getUserByAccessToken = async (client, userId) => {
  const { rows } = await client.query(
    `
    SELECT id, profile_id, name, image
    FROM "user"
    WHERE id = ${userId}
      AND is_deleted = false
    `,
  );
  return convertSnakeToCamel.keysToCamel(rows[0]);
};

const getUserListByProfileId = async (client, profileId) => {
  const { rows } = await client.query (
    `
    SELECT id, name, profile_id, image
    FROM "user"
    WHERE profile_id = $1
      AND is_deleted = false
    `,
    [profileId],
  );
  console.log(rows[0]);
  return convertSnakeToCamel.keysToCamel(rows[0]);
};

const updateUserInformationById = async (client, userId, profileId, name, image) => {
  const { rows } = await client.query(
    `
        UPDATE "user" u
        SET profile_id = $2, name = $3, image = $4
        WHERE id = $1
        RETURNING *   
    `,
    [userId, profileId, name, image],
  );
  console.log(rows[0]);
  return convertSnakeToCamel.keysToCamel(rows[0]);
};

module.exports = {
  checkUserProfileId,
  addUser,
  getUserByAuthenticationCode,
  updateRefreshTokenById,
  getUserById,
  getUserListByProfileIdTeamId,
  getUserListByOnlyProfileId,
  getUserByAccessToken,
  gettaggedUserProfileId,
  getUserListByProfileId,
  updateUserInformationById,
};