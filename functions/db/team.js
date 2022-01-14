const _ = require('lodash');
const convertSnakeToCamel = require('../lib/convertSnakeToCamel');

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
        `
    )
}

const addMember = async (client, teamId, userId) => {
    const { rows } = await client.query(
        `
        INSERT INTO member
        (team_id, user_id)
        VALUES 
        ($1, $2)
        RETURNING *
        `,

        [teamId, userId]
    );
    return convertSnakeToCamel.keysToCamel(rows);
};

module.exports = { addTeam, addHostMember, addMember };
