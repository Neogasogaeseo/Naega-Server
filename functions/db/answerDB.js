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

module.exports = { getRelationship, };