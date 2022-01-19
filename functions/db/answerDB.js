const _ = require('lodash');
const convertSnakeToCamel = require('../lib/convertSnakeToCamel');

const getRelationship = async (client) => {
    const { rows } = await client.query (
        `
        SELECT *
        FROM relationship
        `
    );
    return convertSnakeToCamel.keysToCamel(rows);
};

const getPinnedAnswerByProfileId = async (client, profileId) => {
    const { rows } = await client.query (
        `
        SELECT *
        FROM answer a
        JOIN link_user_form l ON a.link_user_form_id = l.id
        JOIN "user" u ON l.user_id = u.id
        WHERE u.profile_id = $1
            AND a.is_pinned = true
            AND a.is_deleted = false
            AND l.is_deleted = false
            AND u.is_deleted = false
        ORDER BY a.created_at DESC
        `,

        [profileId],
    );
    return convertSnakeToCamel.keysToCamel(rows);
}

module.exports = { getRelationship, getPinnedAnswerByProfileId, };