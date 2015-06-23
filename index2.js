var mapnik = require('mapnik'),
    assert = require('assert'),
    xtend = require('xtend'),
    queue = require('queue-async'),
    pack = require('bin-pack');

/**
 * Pack a list of images with width and height into a sprite layout.
 * Uses bin-pack.
 * @param {Array<Object>} imgs array of `{ buffer: Buffer, id: String }`
 * @param {number} pixelRatio ratio of a 72dpi screen pixel to the destination
 * pixel density
 * @return {Object} layout
 */
function generateLayout(imgs, pixelRatio, format) {
    assert(typeof pixelRatio === 'number' && Array.isArray(imgs));

    // calculate the size of each image and add to width, height props
    var imagesWithSizes = imgs.map(function(img) {
        var image = mapnik.Image.fromSVGBytesSync(img.svg, { scale: pixelRatio });
        return xtend(img, {
            width: image.width(),
            height: image.height(),
            image: image
        });
    });

    // bin-pack the images, adding x, y props
    var packing = pack(imagesWithSizes);

    var obj = {};

    packing.items.forEach(function(item) {
        item.id = item.item.id;
        item.image = item.item.image;
    });

    if (format) {
        packing.items.forEach(function(item) {
            obj[item.id] = {
                width: item.width,
                height: item.height,
                x: item.x,
                y: item.y
            };
        });
        return obj;
    } else {
        return packing;
    }
}
module.exports.generateLayout = generateLayout;

/**
 * Generate a PNG image with positioned icons on a sprite.
 * @param {Object} packing
 * @param {Function} callback
 */
function generateImage(packing, callback) {
    assert(typeof packing === 'object' && typeof callback === 'function');

    var canvas = new mapnik.Image(packing.width, packing.height);
    var composite = canvas.composite.bind(canvas);
    var q = queue();

    for (var i = 0; i < packing.items.length; i++) {
        q.defer(composite, packing.items[i].image, {
            dx: packing.items[i].x,
            dy: packing.items[i].y
        });
    }

    q.awaitAll(function(err) {
        if (err) return callback(err);
        canvas.encode('png', function(err2, encoded) {
            if (err2) return callback(err2);
            callback(null, encoded);
        });
    });
}

module.exports.generateImage = generateImage;
