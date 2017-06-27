var mapnik = require('mapnik');
var queue = require('queue-async');
var ShelfPack = require('@mapbox/shelf-pack');
var xtend = require('xtend');
var assert = require('assert');

module.exports = generateLayoutInternal;

function heightAscThanNameComparator(a, b) {
    return (b.height - a.height) || ((a.id === b.id) ? 0 : (a.id < b.id ? -1 : 1));
}

/**
 * Internally called by `generateLayout()` and `generateLayoutUnique()`
 *
 * @private
 * @param   {Object}                [options]
 * @param   {Object[]}              [options.imgs]        Array of `{ svg: Buffer, id: String }`
 * @param   {number}                [options.pixelRatio]  Ratio of a 72dpi screen pixel to the destination pixel density
 * @param   {boolean}               [options.format]      If true, generate {@link DataLayout}; if false, generate {@link ImgLayout}
 * @param   {boolean}               [options.unique]      If true, deduplicate identical SVG images
 * @param   {boolean}               [options.maxIconSize] optional, overrides the max_size in mapnik
 * @param   {boolean}               [options.removeOversizedIcons] optional, if set, filters out icons that mapnik says are too big
 * @param   {Function}              callback            Accepts two arguments, `err` and `layout` Object
 * @return  {DataLayout|ImgLayout}  layout              Generated Layout Object with sprite contents
 */
function generateLayoutInternal(options, callback) {
    assert(typeof options.pixelRatio === 'number' && Array.isArray(options.imgs));

    if (options.unique) {
        /* If 2 items are pointing to identical buffers (svg icons)
         * create a single image in the sprite but have all ids point to it
         * Remove duplicates from imgs, but if format == true then when creating the
         * resulting layout, make sure all item that had the same signature
         * of an item are also updated with the same layout information.
        */

        /* The svg signature of each item */
        var svgPerItemId = {};

        /* The items for each SVG signature */
        var itemIdsPerSvg = {};

        options.imgs.forEach(function(item) {
            var svg = item.svg.toString('base64');

            svgPerItemId[item.id] = svg;

            if (svg in itemIdsPerSvg) {
                itemIdsPerSvg[svg].push(item.id);
            } else {
                itemIdsPerSvg[svg] = [item.id];
            }
        });

        /* Only keep 1 item per svg signature for packing */
        options.imgs = options.imgs.filter(function(item) {
            var svg = svgPerItemId[item.id];
            return item.id === itemIdsPerSvg[svg][0];
        });
    }


    var q = new queue();

    options.imgs.forEach(function(img) {
        q.defer(createImagesWithSize, img, options);
    });

    q.awaitAll(function(err, imagesWithSizes){
        if (err) return callback(err);

        // remove nulls that get introduced if removeOversizedIcons is true
        imagesWithSizes = imagesWithSizes.filter(function(img) {
          return img;
        });
        
        imagesWithSizes.sort(heightAscThanNameComparator);

        var sprite = new ShelfPack(1, 1, { autoResize: true });
        sprite.pack(imagesWithSizes, { inPlace: true });

        if (options.format) {
            var obj = {};
            imagesWithSizes.forEach(function(item) {
                var itemIdsToUpdate = [item.id];
                if (options.unique) {
                    var svg = svgPerItemId[item.id];
                    itemIdsToUpdate = itemIdsPerSvg[svg];
                }
                itemIdsToUpdate.forEach(function(itemIdToUpdate) {
                    obj[itemIdToUpdate] = {
                        width: item.width,
                        height: item.height,
                        x: item.x,
                        y: item.y,
                        pixelRatio: options.pixelRatio
                    };
                });
            });
            return callback(null, obj);

        } else {
            return callback(null, {
                width: sprite.w,
                height: sprite.h,
                items: imagesWithSizes
            });
        }
    });
}

function createImagesWithSize(img, options, callback) {
    var mapnikOpts = { scale: options.pixelRatio || 1 };
    mapnikOpts.max_size = options.maxIconSize || 2048;
    if (options.format) return getMetaViaParse(img, mapnikOpts, options.removeOversizedIcons, callback);
    getMetaViaRender(img, mapnikOpts, options.removeOversizedIcons, callback);
}

function getMetaViaRender(img, mapnikOpts, removeOversizedIcons, callback) {
    mapnik.Image.fromSVGBytes(img.svg, mapnikOpts, function(err, image) {
        if (err && err.message.match(/image created from svg must be \d+ pixels or fewer on each side/) && removeOversizedIcons) return callback(null, null);
        if (err) return callback(err);
        image.encode('png', function(err, buffer) {
            if (err) return callback(err);
            callback(null, xtend(img, {
                width: image.width(),
                height: image.height(),
                buffer: buffer
            }));
        });
    });
}

function getMetaViaParse(img, mapnikOpts, removeOversizedIcons, callback) {
    var error = null;
    var result = null;
    try {
        var meta = mapnik.Image.parseSVGMetaBytesSync(img.svg); 
        var width = meta.width * mapnikOpts.scale;
        var height = meta.height * mapnikOpts.scale;
        var tooBig = height > mapnikOpts.max_size || width > mapnikOpts.max_size;
        if (tooBig && removeOversizedIcons === false) {
            error = new Error('image created from svg must be '+ mapnikOpts.max_size +' pixels or fewer on each side'); 
        }
        else if (tooBig === false) {
          result = xtend(img, {
            width, height
          });
          
        }
    }
    catch (err) {
      error = err;
    }
    setTimeout(function() {
      callback(error, result);
    });
}

/**
 * Spritezero can generate 2 kinds of layout objects: {@link DataLayout} and {@link ImgLayout}.
 *
 * A `ImgLayout` Object contains the array of image items along with dimensions
 * and a buffer of image data that can be used for generating the output image.
 *
 * @typedef  {Object}    ImgLayout
 * @example
 * {
 *    width: 512,
 *    height: 512,
 *    items: [
 *      {
 *        "height": 12,
 *        "width": 12,
 *        "x": 133,
 *        "y": 282,
 *        "buffer": "..."
 *      }, ... etc ...
 *    ]
 * }
 */


/**
 * Spritezero can generate 2 kinds of layout objects: {@link DataLayout} and {@link ImgLayout}.
 *
 * A `DataLayout` Object contains all the metadata about the contents of the sprite.
 * This data can be exported to a JSON sprite manifest file.
 *
 * The keys of the Object are the icon ids.
 * The values of the Object are the structured data about each icon.
 *
 * @typedef  {Object}    DataLayout
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
