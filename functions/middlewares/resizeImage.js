const statusCode = require('../constants/statusCode');

const resizeImage = (image) => {
  if (!image) {
    return image;
  }
  try {
    const splited = image.split('/o/');
    let url = splited[1].split('.');
    url[0] += '_200x200';
    const res = splited[0] + '/o/' + url[0] + '.' + url[1];
    return res;
  } catch (error) {
    return null;
  }
};

module.exports = resizeImage;
