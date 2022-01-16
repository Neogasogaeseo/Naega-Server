const crypto = require('crypto');

const algorithm = 'aes-256-ctr';
const secretKey = 'vOVH6sdmpNWjRRIqCc7rdxs01lwHzfr3';
const iv = crypto.randomBytes(16);

const encrypt = (userId, teamId) => {
  const json = {
    userId,
    teamId,
  };
  const text = JSON.stringify(json);
  const cipher = crypto.createCipheriv(algorithm, secretKey, iv);
  const encrypted = Buffer.concat([cipher.update(text), cipher.final()]);

  return {
    iv: iv.toString('hex'),
    q: encrypted.toString('hex'),
  };
};

const decrypt = (hash) => {
  const decipher = crypto.createDecipheriv(algorithm, secretKey, Buffer.from(hash.iv, 'hex'));
  const string = Buffer.concat([decipher.update(Buffer.from(hash.q, 'hex')), decipher.final()]);
  const decrypted = JSON.parse(string.toString());
  return decrypted;
};

module.exports = {
  encrypt,
  decrypt,
};
