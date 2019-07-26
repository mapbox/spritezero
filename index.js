var mapnik = require('mapnik');
var assert = require('assert');
var xtend = require('xtend');
var ShelfPack = require('@mapbox/shelf-pack');
var queue = require('queue-async');
var emptyPNG = new mapnik.Image(1, 1).encodeSync('png');
var { JSDOM } = require('jsdom');
var SvgPath = require('svgpath');
var sdf = require('fontnik').pathToSDF;
var PNG = require('pngjs').PNG;

module.exports.generateLayout = generateLayout;
module.exports.generateLayoutUnique = generateLayoutUnique;
module.exports.generateImage = generateImage;


function heightAscThanNameComparator(a, b) {
    return (b.height - a.height) || ((a.id === b.id) ? 0 : (a.id < b.id ? -1 : 1));
}


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
 * @param   {boolean}               [options.sdf]         If true, create PNGs from signed distance fields
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
 * @param   {boolean}               [options.sdf]         If true, create PNGs from signed distance fields
 * @param   {Function}              callback              Accepts two arguments, `err` and `layout` Object
 * @return  {DataLayout|ImgLayout}  layout                Generated Layout Object with sprite contents
 */
function generateLayoutUnique(options, callback) {
    options = options || {};
    options.unique = true;
    return generateLayoutInternal(options, callback);
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
 * @param   {boolean}               [options.sdf]         If true, create PNGs from signed distance fields
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

    function createImagesWithSize(img, callback) {
        if (options.sdf) {
          return sdfRender(img, callback);
        }
        var mapnikOpts = { scale: options.pixelRatio };
        if (options.maxIconSize) {
            mapnikOpts.max_size = options.maxIconSize;
        }
        mapnik.Image.fromSVGBytes(img.svg, mapnikOpts, function(err, image) {
            if (err && err.message.match(/image created from svg must be \d+ pixels or fewer on each side/) && options.removeOversizedIcons) return callback(null, null);
            if (err) return callback(err);
            if (!image.width() || !image.height()) return callback(null, null);
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

    function sdfRender(img, callback) {
        var buffer = 3;
        var cutoff = 2/8;
        var svg = JSDOM.fragment(img.svg.toString());

        var el = svg.querySelector('svg');

        var w = parseInt(el.getAttribute('width')) * options.pixelRatio;
        var h = parseInt(el.getAttribute('height')) * options.pixelRatio;
        var wb = w + 2 * buffer;
        var hb = h + 2 * buffer;

        var commands = [];

        var paths = svg.querySelectorAll('path');
        for (var i = 0; i < paths.length; i++) {
          var path = paths[i];

          var scaledPath = new SvgPath(path.getAttribute('d')).scale(options.pixelRatio).toString()
          var svgPath = new SvgPath(scaledPath).abs().unshort().unarc();

          var parent = path.parentElement;
          while (parent.tagName === 'G') {
            if (parent.querySelector('transform')) {
              svgPath.transform(parent.querySelector('transform'));
            }
            parent = parent.parentElement;
          }

          if (svg.querySelector('viewBox')) {
            var viewBox = svg.querySelector('viewBox').split(/\s+/);
            svgPath.translate(-viewBox[0], -viewBox[1]);
          }

          var commands = commands.concat(svgPath.segments.map(function(segment) {
            switch (segment[0]) {
              case 'H':
                return { type: segment[0], x: segment[1] };
              case 'V':
                return { type: segment[0], y: segment[1] };
              case 'M':
              case 'L':
                return { type: segment[0], x: segment[1], y: segment[2] };
              case 'Q':
                return {
                  type: segment[0],
                  x1: segment[1],
                  y1: segment[2],
                  x: segment[3],
                  y: segment[4]
                };
              case 'C':
                return {
                  type: segment[0],
                  x1: segment[1],
                  y1: segment[2],
                  x2: segment[3],
                  y2: segment[4],
                  x: segment[5],
                  y: segment[6]
                };
              case 'Z':
                return { type: segment[0] };
              default:
                throw new Error('Unknown command: ' + segment[0]);
            }
          }));
        }
        var data = sdf(commands, w, h, buffer, cutoff);
        var png = new PNG({ width: wb, height: hb });

        for (var j = 0; j < wb * hb; j++) {
          png.data[j * 4] = 0;
          png.data[j * 4 + 1] = 0;
          png.data[j * 4 + 2] = 0;
          png.data[j * 4 + 3] = data[j];
        }
        var buf = PNG.sync.write(png);
        callback(null, xtend(img, {
          width: wb,
          height: hb,
          buffer: buf
        }));
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
                    if (options.sdf) {
                      obj[itemIdToUpdate].sdf = true;
                    }
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


/**
 * Generate a PNG image with positioned icons on a sprite.
 *
 * @param  {ImgLayout}   layout    An {@link ImgLayout} Object used to generate the image
 * @param  {Function}    callback  Accepts two arguments, `err` and `image` data
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
