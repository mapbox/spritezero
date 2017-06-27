var generateLayoutInternal = require('./lib/generate-layout');
var generateImage = require('./lib/generate-image');

module.exports.generateLayout = generateLayout;
module.exports.generateLayoutUnique = generateLayoutUnique;
module.exports.generateImage = generateImage;


/**
 * Pack a list of images with width and height into a sprite layout.
 * options object with the following keys:
 *
 * @param   {Object}                [options]
 * @param   {Object[]}              [options.imgs]        Array of `{ svg: Buffer, id: String }`
 * @param   {number}                [options.pixelRatio]  Ratio of a 72dpi screen pixel to the destination pixel density
 * @param   {boolean}               [options.format]      If true, generate {@link DataLayout}; if false, generate {@link ImgLayout}
 * @param   {boolean}               [options.maxIconSize] optional, overrides the max_size in mapnik
 * @param   {boolean}               [options.removeOversizedIcons] optional, if set, filters out icons that mapnik says are too big
 * @param   {Function}              callback              Accepts two arguments, `err` and `layout` Object
 * @return  {DataLayout|ImgLayout}  layout                Generated Layout Object with sprite contents
 */
function generateLayout(options, callback) {
    options = options || {};
    options.unique = false;
    return generateLayoutInternal(options, callback);
}


/**
 * Same as generateLayout but can be used to dedupe identical SVGs
 * and still preserve the reference.
 *
 * For example if `A.svg` and `B.svg` are identical, a single icon
 * will be in the sprite image and both A and B will reference the same image
 *
 * options object with the following keys:
 *
 * @param   {Object}                [options]
 * @param   {Object[]}              [options.imgs]        Array of `{ svg: Buffer, id: String }`
 * @param   {number}                [options.pixelRatio]  Ratio of a 72dpi screen pixel to the destination pixel density
 * @param   {boolean}               [options.format]      If true, generate {@link DataLayout}; if false, generate {@link ImgLayout}
 * @param   {boolean}               [options.maxIconSize] optional, overrides the max_size in mapnik
 * @param   {boolean}               [options.removeOversizedIcons] optional, if set, filters out icons that mapnik says are too big
 * @param   {Function}              callback              Accepts two arguments, `err` and `layout` Object
 * @return  {DataLayout|ImgLayout}  layout                Generated Layout Object with sprite contents
 */
function generateLayoutUnique(options, callback) {
    options = options || {};
    options.unique = true;
    return generateLayoutInternal(options, callback);
}


