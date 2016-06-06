var mapnik = require('mapnik');
var assert = require('assert');
var xtend = require('xtend');
var ShelfPack = require('shelf-pack');
var queue = require('queue-async');
var emptyPNG = new mapnik.Image(1, 1).encodeSync('png');

function heightAscThanNameComparator(a, b) {
    return (b.height - a.height) || ((a.id === b.id) ? 0 : (a.id < b.id ? -1 : 1));
};

/**
 * Pack a list of images with width and height into a sprite layout.
 * Uses shelf-pack.
 * @param {Array<Object>} imgs array of `{ buffer: Buffer, id: String }`
 * @param {number} pixelRatio ratio of a 72dpi screen pixel to the destination
 * pixel density
 * @return {Object} layout
 * @param {Function} callback
 */
function generateLayout(imgs, pixelRatio, format, callback) {
    return generateLayoutInternal(imgs, pixelRatio, format, false, callback);
}

/**
 * Same as generateLayout but can be used to dedupe identical SVGs
 * and still preserve the reference.
 * For example if A.svg and B.svg are identical, a single icon
 * will be in the sprite image and both A and B will reference the same image
 */
function generateLayoutUnique(imgs, pixelRatio, format, callback) {
    return generateLayoutInternal(imgs, pixelRatio, format, true, callback);
}

function generateLayoutInternal(imgs, pixelRatio, format, unique, callback) {
    assert(typeof pixelRatio === 'number' && Array.isArray(imgs));
    
    if (unique) {
        /* If 2 items are pointing to identical buffers (svg icons)
         * create a single image in the sprite but have all ids point to it
         * Remove duplicates from imgs, but if format == true then when creating the 
         * resulting layout, make sure all item that had the same signature 
         * of an item are also updated with the same layout information.
        */
    
        /* The svg signature of each item */
        var svgPerItemId = {}
    
        /* The items for each SVG signature */
        var itemIdsPerSvg = {};
    
        imgs.forEach(function(item) {
            var svg = item.svg.toString('base64');
        
            svgPerItemId[item.id] = svg;
        
            if (svg in itemIdsPerSvg) {
                itemIdsPerSvg[svg].push(item.id);
            } else {
                itemIdsPerSvg[svg] = [item.id];
            }
        });
    
        /* Only keep 1 item per svg signature for packing */
        imgs = imgs.filter(function(item) {
            var svg = svgPerItemId[item.id];
            return item.id === itemIdsPerSvg[svg][0]
        });
    }
    
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

    var q = new queue();

    imgs.forEach(function(img) {
        q.defer(createImagesWithSize, img);
    });

    q.awaitAll(function(err, imagesWithSizes){
        if (err) return callback(err);

        imagesWithSizes.sort(heightAscThanNameComparator);

        var sprite = new ShelfPack(1, 1, { autoResize: true });
        sprite.pack(imagesWithSizes, { inPlace: true });

        if (format) {
            var obj = {};
            imagesWithSizes.forEach(function(item) {
                var itemIdsToUpdate = [item.id];
                if (unique) {
                    var svg = svgPerItemId[item.id];
                    itemIdsToUpdate = itemIdsPerSvg[svg];
                }
                itemIdsToUpdate.forEach(function(itemIdToUpdate) {
                    obj[itemIdToUpdate] = {
                        width: item.width,
                        height: item.height,
                        x: item.x,
                        y: item.y,
                        pixelRatio: pixelRatio
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
module.exports.generateLayout = generateLayout;
module.exports.generateLayoutUnique = generateLayoutUnique;

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
