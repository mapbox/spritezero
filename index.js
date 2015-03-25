var Canvas = require('canvas'),
    xtend = require('xtend'),
    path = require('path'),
    pack = require('bin-pack');

/**
 * Decode a single image, returning a node-canvas Image object
 * and exposing its width and height programmatically.
 *
 * @param {Object} image
 * @param {Buffer} image.buffer
 * @param {String} image.id
 * @returns {Object} parsed image with width, height, and pixelRatio
 */
function decodeImage(img) {
    var image = new Canvas.Image();
    image.src = img.buffer;
    return xtend(img, {
        image: image,
        width: image.width,
        height: image.height
    });
}

module.exports.decodeImage = decodeImage;

/**
 * Pack a list of images with width and height into a sprite layout.
 * Uses bin-pack.
 * @param {Array<Object>} imgs array of { buffer: ..., id: ..., pixels: ..., width: ... height: ... }
 */
function generateLayout(imgs) { return pack(imgs); }

module.exports.generateLayout = generateLayout;

/**
 * Generate a PNG image with positioned icons on a sprite.
 * @param {Array<Object>} imgs array of { buffer: ..., id: ..., pixels: ..., width: ... height: ... x: ... y: ... }
 * @param {Function} callback
 */
function generateImage(packing, callback) {
    var canvas = new Canvas(packing.width, packing.height);
    var ctx = canvas.getContext('2d');
    packing.items.forEach(function(img) {
        ctx.drawImage(img.item.image, img.x, img.y);
    });
    canvas.toBuffer(callback);
}

module.exports.generateImage = generateImage;

/**
 * format layout for output: make it json serializable and all that.
 *
 * @param {Object} packing the output of generateLayout
 * @returns {Object} serializable sprite metadata
 * @example
 * var layout = spritezero.generateLayout(images
 *   .map(spritezero.decodeImage));
 *
 * spritezero.generateImage(layout, function(err, res) {
 *   // res is a buffer of an image
 * });
 */
function formatLayout(packing) {
    var obj = {};

    packing.items.forEach(function(item) {
        obj[item.item.id] = {
            x: item.x,
            y: item.y,
            width: item.width,
            height: item.height,
            sdf: false,
            pixelRatio: item.item.pixelRatio
        };
    });

    return obj;
}

module.exports.formatLayout = formatLayout;
