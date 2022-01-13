const axios = require('axios');
const util = require('../../../lib/util');
const statusCode = require('../../../constants/statusCode');
const responseMessage = require('../../../constants/responseMessage');
const db = require('../../../db/db');
const { userDB } = require('../../../db');
const jwtHandlers = require('../../../lib/jwtHandlers');

module.exports = async (req, res) => {
  const { profileId, name, img, provider, accesstoken, refreshtoken } = req.body;
  let client;
  let kakao_profile = '';
  if (!accesstoken && !refreshtoken) {
    return res.status(statusCode.BAD_REQUEST).send(util.fail(statusCode.BAD_REQUEST, responseMessage.NULL_VALUE));
  }

  try {
    kakao_profile = await axios.get('https://kapi.kakao.com/v2/user/me', {
      headers: {
        Authorization: 'Bearer ' + accesstoken,
        'Content-Type': 'application/json',
      },
    });
  } catch (error) {
    return res.status(statusCode.NOT_FOUND).json(util.fail(statusCode.NOT_FOUND, responseMessage.WRONG_TOKEN));
  }
  try {
    client = await db.connect();
    const user = await userDB.addUser(client, profileId, name, kakao_profile.data.id, refreshtoken, provider); // refresh token 으로
    const accesstoken = jwtHandlers.sign(user);
    return res.status(statusCode.OK).send(
      util.success(statusCode.OK, responseMessage.CREATED_USER, {
        user,
        accesstoken,
      }),
    );
  } catch (error) {
    res.status(statusCode.INTERNAL_SERVER_ERROR).send(util.fail(statusCode.INTERNAL_SERVER_ERROR, responseMessage.INTERNAL_SERVER_ERROR));
  } finally {
    client.release();
  }
};
