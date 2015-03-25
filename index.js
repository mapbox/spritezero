var blend = require('blend'),
    tiletype = require('tiletype'),
    xtend = require('xtend'),
    pack = require('bin-pack');

/**
 * Pack a list of images with width and height into a sprite layout.
 * Uses bin-pack.
 * @param {Array<Object>} imgs array of `{ buffer: Buffer, id: String, pixelRatio: Number }`
 * @param {boolean} removeBuffer produce a JSON-serializable version
 * @return {Object} layout
 */
function generateLayout(imgs, removeBuffer) {
    var packing = pack(imgs.map(function(img) {
        var dimensions = tiletype.dimensions(img.buffer);
        return xtend(img, { width: dimensions[0], height: dimensions[1] });
    }));
    packing.items.forEach(function(item) {
        item.id = item.item.id;
        if (removeBuffer) { delete item.item; }
        else { item.buffer = item.item.buffer; }
    });
    return packing;
}

module.exports.generateLayout = generateLayout;

/**
 * Generate a PNG image with positioned icons on a sprite.
 * @param {Object} packing
 * @param {Function} callback
 */
function generateImage(packing, callback) {
    blend(packing.items, {
        width: packing.width,
        height: packing.height
    }, callback);
}

module.exports.generateImage = generateImage;
