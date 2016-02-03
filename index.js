var mapnik = require('mapnik');
var assert = require('assert');
var xtend = require('xtend');
var pack = require('bin-pack');
var queue = require('queue-async');
var emptyPNG = new mapnik.Image(1, 1).encodeSync('png');

/**
 * Pack a list of images with width and height into a sprite layout.
 * Uses bin-pack.
 * @param {Array<Object>} imgs array of `{ buffer: Buffer, id: String }`
 * @param {number} pixelRatio ratio of a 72dpi screen pixel to the destination
 * pixel density
 * @return {Object} layout
 * @param {Function} callback
 */
function generateLayout(imgs, pixelRatio, format, callback) {
    assert(typeof pixelRatio === 'number' && Array.isArray(imgs));
    var q = new queue();

    function createImagesWithSize(img, callback) {
        mapnik.Image.fromSVGBytes(img.svg, { scale: pixelRatio }, function(err, image) {
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

    imgs.forEach(function(img) {
        q.defer(createImagesWithSize, img);
    });

    q.awaitAll(function(err, imagesWithSizes){
        if (err) return callback(err);
        var packing = pack(imagesWithSizes);

        var obj = {};

        packing.items.forEach(function(item) {
            item.id = item.item.id;
            item.buffer = item.item.buffer;
        });

        if (format) {
            packing.items.forEach(function(item) {
                obj[item.id] = {
                    width: item.width,
                    height: item.height,
                    x: item.x,
                    y: item.y,
                    pixelRatio: pixelRatio
                };
            });
            return callback(null, obj);
        } else {
            return callback(null, packing);
        }
    })
}
module.exports.generateLayout = generateLayout;

/**
 * Generate a PNG image with positioned icons on a sprite.
 * @param {Object} packing
 * @param {Function} callback
 */
function generateImage(packing, callback) {
    assert(typeof packing === 'object' && typeof callback === 'function');
    if (!packing.items.length) return callback(null, emptyPNG);

    mapnik.blend(packing.items, {
        width: packing.width,
        height: packing.height
    }, callback);
}

module.exports.generateImage = generateImage;
