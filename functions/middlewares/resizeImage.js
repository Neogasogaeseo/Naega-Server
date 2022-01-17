const resizeImage = (image) => {
  const splited = image.split('/o/');
  let url = splited[1].split('.');
  url[0] += '_200x200';
  const res = splited[0] + '/o/' + url[0] + '.' + url[1];
  return res;
};

module.exports = resizeImage;
