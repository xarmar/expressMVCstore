/**
 * Returns true if file mimetype is image/[jpg, jpeg, png] *
 * @param {String} fileMimeType The file's mimetype. i.e: 'image/jpg'
 * @return {Boolean} Boolean
 */
const fileIsValidImg = (fileMimeType) => {
  let validExts = ["jpg", "jpeg", "png"];
  if (validExts.some((ext) => ext === fileMimeType.replace("image/", ""))) {
    return true;
  }
  return false;
};

module.exports = fileIsValidImg;
