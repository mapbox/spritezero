var mapnik = require('mapnik');
var assert = require('assert');
var xtend = require('xtend');
var crypto = require('crypto');
var ShelfPack = require('@mapbox/shelf-pack');
var queue = require('queue-async');
var emptyPNG = new mapnik.Image(1, 1).encodeSync('png');

module.exports.generateLayout = generateLayout;
module.exports.generateImage = generateImage;
module.exports.generateManifest = generateManifest;

/**
 * Pack a list of images with width and height into a sprite layout.
 * options object with the following keys:
 *
 * @param   {Object}                [options]
 * @param   {Object[]}              [options.imgs]        Array of `{ svg: Buffer, id: String }`
 * @param   {number}                [options.pixelRatio]  Ratio of a 72dpi screen pixel to the destination pixel density
 * @param   {boolean}               [options.maxIconSize] optional, overrides the max_size in mapnik
 * @param   {boolean}               [options.removeOversizedIcons] optional, if set, filters out icons that mapnik says are too big
 * @param   {boolean}               [options.unique]      optional, if set, filters out duplicate icons
 * @param   {Function}              callback              Accepts two arguments, `err` and `layout` Object
 * @return  {Layout}                layout                Generated Layout Object with sprite contents
 */
function generateLayout(options, callback) {
    options = options || {};
    assert(typeof options.pixelRatio === 'number' && Array.isArray(options.imgs));

    if (options.unique) {
        /* If 2 items are pointing to identical buffers (svg icons)
         * create a single image in the sprite but have all ids point to it
         * Remove duplicates from imgs, but stores the names of all input images
         * so that metadata generating creates individual references to the same
         * location on the sprite sheet.
        */

        /* The svg signature of each item */
        var svgPerItemId = {};

        /* The items for each SVG signature */
        var itemIdsPerSvg = {};

        options.imgs.forEach(function(item) {
            var hash = crypto.createHash('sha1').update(item.svg).digest('hex');

            svgPerItemId[item.id] = hash;

            if (hash in itemIdsPerSvg) {
                itemIdsPerSvg[hash].push(item.id);
            } else {
                itemIdsPerSvg[hash] = [item.id];
            }
        });

        /* Only keep 1 item per svg signature for packing */
        options.imgs = options.imgs.filter(function(item) {
            var svg = svgPerItemId[item.id];
            return item.id === itemIdsPerSvg[svg][0];
        });
    }

    function createImagesWithSize(img, callback) {
        var mapnikOpts = { scale: options.pixelRatio };
        if (options.maxIconSize) {
            mapnikOpts.max_size = options.maxIconSize;
        }
        mapnik.Image.fromSVGBytes(img.svg, mapnikOpts, function(err, image) {
            if (err && err.message.match(/image created from svg must be \d+ pixels or fewer on each side/) && options.removeOversizedIcons) return callback(null, null);
            if (err) return callback(err);
            image.encode('png', function(err, buffer) {
                if (err) return callback(err);
                callback(null, xtend(img, {
                    width: image.width(),
                    height: image.height(),
                    buffer: buffer,
                    names: options.unique ? itemIdsPerSvg[svgPerItemId[img.id]] : [ img.id ]
                }));
            });
        });
    }

    var q = new queue();

    options.imgs.forEach(function(img) {
        q.defer(createImagesWithSize, img);
    });

    q.awaitAll(function(err, imagesWithSizes){
        if (err) return callback(err);

        // remove nulls that get introduced if removeOversizedIcons is true
        imagesWithSizes = imagesWithSizes.filter(function(img) {
          return img;
        });
        
        // sorts by height ascendingly, then by name
        imagesWithSizes.sort(function (a, b) {
            return (b.height - a.height) || ((a.id === b.id) ? 0 : (a.id < b.id ? -1 : 1));
        });

        var sprite = new ShelfPack(1, 1, { autoResize: true });
        sprite.pack(imagesWithSizes, { inPlace: true });

        return callback(null, {
            width: sprite.w,
            height: sprite.h,
            pixelRatio: options.pixelRatio,
            items: imagesWithSizes
        });
    });
}


/**
 * Generate a PNG image with positioned icons on a sprite.
 *
 * @param  {Layout}   layout    An {@link Layout} Object used to generate the image
 * @param  {Function} callback  Accepts two arguments, `err` and `image` data
 */
function generateImage(layout, callback) {
    assert(typeof layout === 'object' && typeof callback === 'function');
    if (!layout.items.length) return callback(null, emptyPNG);

    mapnik.blend(layout.items, {
        width: layout.width,
        height: layout.height
    }, callback);
}


/**
 * Generate a {Manifest} object with information on where the icons are on the sprite.
 *
 * @param  {Layout}   layout    An {@link Layout} Object used to generate the image
 * @return {Manifest} layout    A Manifest object
 */
function generateManifest(layout) {
    assert(typeof layout === 'object');
    if (!layout.items.length) return {};

    var obj = {};
    layout.items.forEach(function(item) {
        item.names.forEach(function(name) {
            obj[name] = {
                width: item.width,
                height: item.height,
                x: item.x,
                y: item.y,
                pixelRatio: layout.pixelRatio
            };
        });
    });
    return obj;
}


/**
 * A `Layout` Object contains the array of image items along with dimensions
 * and a buffer of image data that can be used for generating the output image.
 * It can be used to generate a PNG sprite sheet with {@link generateImage}, or a
 * JSON manifest file with {@link generateManifest}.
 *
 * @typedef  {Object}    Layout
 * @example
 * {
 *    width: 512,
 *    height: 512,
 *    pixelRatio: 1,
 *    items: [
 *      {
 *        "height": 12,
 *        "width": 12,
 *        "x": 133,
 *        "y": 282,
 *        "buffer": "...",
 *        "names": [ ... ]
 *      }, ... etc ...
 *    ]
 * }
 */


/**
 * A `Manifest` Object contains all the metadata about the contents of the sprite.
 * This data can be exported to a JSON sprite manifest file.
 *
 * The keys of the Object are the icon ids.
 * The values of the Object are the structured data about each icon.
 *
 * @typedef  {Object}    Manifest
 * @example
 * {
 *    "aerialway-12": {
 *      "width": 12,
 *      "height": 12,
 *      "pixelRatio": 1,
 *      "x": 133,
 *      "y": 282
 *    }, ... etc ...
 * }
 */
