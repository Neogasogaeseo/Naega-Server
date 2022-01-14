const _ = require('lodash');
const convertSnakeToCamel = require('../lib/convertSnakeToCamel');

const addUser = async (client, profileId, name, authenticationCode, refreshToken, provider) => {
  const { rows } = await client.query(
    `
        INSERT INTO "user"
        (profile_id, name, authentication_code, refresh_token, provider)
        VALUES
        ($1, $2, $3, $4, $5)
        RETURNING *
        `,

    [profileId, name, authenticationCode, refreshToken, provider],
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

module.exports = { addUser, getUserByAuthenticationCode, updateRefreshTokenById, getUserById };
