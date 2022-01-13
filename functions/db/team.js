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

module.exports = { addTeam };
