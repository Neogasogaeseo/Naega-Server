const _ = require('lodash');
const convertSnakeToCamel = require('../lib/convertSnakeToCamel');

const addLinkAnswerKeyword = async (client, answerId, keywordList) => {
    const valuesQeury = keywordList.map( x => `(${answerId}, ${x})`).join(', ').toString()

    const { rows } = await client.query (
    `
    INSERT INTO link_answer_keyword
    (answer_id, keyword_id)
    VALUES
    ${valuesQeury}
    RETURNING *
    `,
    );
    return convertSnakeToCamel.keysToCamel(rows);
};

module.exports = { addLinkAnswerKeyword, };