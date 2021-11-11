/**
 * Returns the updated image path for an image   *
 * @param {String} oldCategoryTitle The machine_name of the old category title.
 * @param {String} newCategoryTitle The machine_name of the new category title'
 * @param {String} originalPath The original path for the item's image. i.e: /images/tuna_fish.jpg
 * @return {String} New path for image
 */
 const getNewImagePath = (oldCategoryTitle, newCategoryTitle, originalPath) => {
  let newImagePath = originalPath.replace(oldCategoryTitle, newCategoryTitle);
  return newImagePath
};

module.exports = getNewImagePath;
