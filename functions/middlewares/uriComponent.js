const encrypt = async (userId, teamId) => {
  try {
    const json = {
      userId,
      teamId,
    };
    const string = JSON.stringify(json);
    const encrypted = encodeURIComponent(string);
    return encrypted;
  } catch (error) {
    console.log(error);
  }
};

const decrypt = async (encrpyted) => {
  try {
    const string = decodeURIComponent(encrpyted);
    const decrypted = JSON.parse(string);
    return decrypted;
  } catch (error) {
    console.log(error);
  }
};

module.exports = { encrypt, decrypt };
