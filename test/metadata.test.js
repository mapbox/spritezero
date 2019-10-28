const test = require('tap').test;
const fs = require('fs');

const extractMetadata = require('../lib/extract-svg-metadata');
const validateMetadata = require('../lib/validate-svg-metadata');

test('image without metadata', function(t) {
    extractMetadata({
        svg: fs.readFileSync(`${__dirname}/fixture/svg/aerialway-24.svg`, 'utf-8')
    }, function(err, metadata) {
        t.error(err);
        t.deepEqual(metadata, {}, 'does not have metadata');
        t.end();
    });
});

test('image with nested metadata', function(t) {
    extractMetadata({
        svg: fs.readFileSync(`${__dirname}/fixture/svg-metadata/cn-nths-expy-2-affinity.svg`, 'utf-8')
    }, function(err, metadata) {
        t.error(err);
        t.ok(metadata);
        t.deepEqual(metadata, {
            'stretch-x': [[4, 16]],
            'stretch-y': [[5, 16]],
            content: [2, 5, 18, 18]
        });
        t.end();
    });
});

test('image exported by Illustrator', function(t) {
    extractMetadata({
        svg: fs.readFileSync(`${__dirname}/fixture/svg-metadata/shield-illustrator.svg`)
    }, function(err, metadata) {
        t.error(err);
        t.ok(metadata);
        t.deepEqual(metadata, {
            content: [4, 8, 14, 14],
            'stretch-y': [[8, 14]],
            'stretch-x': [[4, 14]]
        });
        t.end();
    });
});

test('image exported by Illustrator, rotated', function(t) {
    extractMetadata({
        svg: fs.readFileSync(`${__dirname}/fixture/svg-metadata/shield-illustrator-rotated.svg`)
    }, function(err, metadata) {
        t.error(err);
        t.ok(metadata);
        t.deepEqual(metadata, {
            content: [3.703, 5.806, 12.189, 14.291],
            'stretch-y': [[10.58, 14.257]],
            'stretch-x': [[3.73, 9.528]]
        });
        t.end();
    });
});

test('image exported by Illustrator, rotated + translated', function(t) {
    extractMetadata({
        svg: fs.readFileSync(`${__dirname}/fixture/svg-metadata/shield-illustrator-rotated-translated.svg`)
    }, function(err, metadata) {
        t.error(err);
        t.ok(metadata);
        t.deepEqual(metadata, {
            content: [4.242, 7.07, 11.313, 14.142],
            'stretch-y': [[10.606, 14.142]],
            'stretch-x': [[4.242, 9.192]]
        });
        t.end();
    });
});

test('image exported by Illustrator, rotated + reversed', function(t) {
    extractMetadata({
        svg: fs.readFileSync(`${__dirname}/fixture/svg-metadata/shield-illustrator-rotated-reversed.svg`)
    }, function(err, metadata) {
        t.error(err);
        t.ok(metadata);
        t.deepEqual(metadata, {
            content: [6, 8, 12, 12],
            'stretch-y': [[8, 12]],
            'stretch-x': [[6, 12]]
        });
        t.end();
    });
});

test('image with one stretch rect', function(t) {
    extractMetadata({
        svg: fs.readFileSync(`${__dirname}/fixture/svg-metadata/cn-nths-expy-2-inkscape-plain.svg`)
    }, function(err, metadata) {
        t.error(err);
        t.ok(metadata);
        t.deepEqual(metadata, {
            'stretch-x': [[3, 17]],
            'stretch-y': [[5, 17]],
        });
        t.end();
    });
});

test('image with multiple stretch zones', function(t) {
    extractMetadata({
        svg: fs.readFileSync(`${__dirname}/fixture/svg-metadata/ae-national-3-affinity.svg`)
    }, function(err, metadata) {
        t.error(err);
        t.ok(metadata);
        t.deepEqual(metadata, {
            'stretch-x': [[5, 7], [20, 22]],
            'content': [3, 7, 23, 18]
        });
        t.end();
    });
});

test('image with multiple stretch zones and higher pixelRatio', function(t) {
    extractMetadata({
        pixelRatio: 2,
        svg: fs.readFileSync(`${__dirname}/fixture/svg-metadata/ae-national-3-affinity.svg`)
    }, function(err, metadata) {
        t.error(err);
        t.ok(metadata);
        t.deepEqual(metadata, {
            'stretch-x': [[10, 14], [40, 44]],
            'content': [6, 14, 46, 36]
        });
        t.end();
    });
});

test('invalid svg', function(t) {
    extractMetadata({ svg: '<svg>' }, function(err) {
        t.match(err, { message: /Unclosed root tag/ });
        t.end();
    });
});


test('invalid images', function(t) {
    t.test('content area without height', function(t) {
        extractMetadata({ svg: '<svg><rect id="mapbox-icon-content" x="0" y="0" width="30"/></svg>' }, function(err, metadata) {
            t.error(err);
            t.deepEqual(metadata, {});
            t.end();
        });
    });

    t.test('invalid mapbox-icon-* ID', function(t) {
        extractMetadata({ svg: '<svg><rect id="mapbox-icon-none" x="0" width="30" height="20"/></svg>' }, function(err, metadata) {
            t.error(err);
            t.deepEqual(metadata, {});
            t.end();
        });
    });

    t.test('no path data', function(t) {
        extractMetadata({ svg: '<svg><path id="mapbox-icon-content"/></svg>' }, function(err, metadata) {
            t.error(err);
            t.deepEqual(metadata, {});
            t.end();
        });
    });


    t.test('invalid path data', function(t) {
        extractMetadata({ svg: '<svg><path id="mapbox-icon-content" d="hello"/></svg>' }, function(err, metadata) {
            t.error(err);
            t.deepEqual(metadata, {});
            t.end();
        });
    });

    t.end();
});

test('valid metadata', function(t) {
    const img = { width: 24, height: 18 };

    t.error(validateMetadata(img, {}));

    t.error(validateMetadata(img, { content: [ 2, 2, 22, 16 ] }));
    t.error(validateMetadata(img, { content: [ 0, 0, 24, 18 ] }));

    t.error(validateMetadata(img, { 'stretch-x': [] }));
    t.error(validateMetadata(img, { 'stretch-x': [[10, 14]] }));
    t.error(validateMetadata(img, { 'stretch-y': [[8, 10]] }));

    t.end();
});


test('invalid metadata', function(t) {
    t.match(validateMetadata(), { message: 'image is invalid' }, 'rejects missing object');
    t.match(validateMetadata({}), { message: 'image has invalid metadata' }, 'rejects missing object');

    t.match(validateMetadata({}, {}), { message: 'image has invalid width' }, 'rejects missing width');
    t.match(validateMetadata({ width: 0 }, {}), { message: 'image has invalid width' }, 'rejects zero width');
    t.match(validateMetadata({ width: -3 }, {}), { message: 'image has invalid width' }, 'rejects negative width');
    t.match(validateMetadata({ width: 32 }), {}, { message: 'image has invalid height' }, 'rejects missing height');
    t.match(validateMetadata({ width: 32, height: {} }, {}), { message: 'image has invalid height' }, 'rejects height as object');
    t.match(validateMetadata({ width: 32, height: -32 }, {}), { message: 'image has invalid height' }, 'rejects negative height');

    const img = { width: 24, height: 18 };

    t.match(validateMetadata(img, { content: {} }),
        { message: 'image content area must be an array of 4 numbers' }, 'rejects invalid content area format');
    t.match(validateMetadata(img, { content: [] }),
        { message: 'image content area must be an array of 4 numbers' }, 'rejects invalid content area format');
    t.match(validateMetadata(img, { content: [ 1, 2, 3 ] }),
        { message: 'image content area must be an array of 4 numbers' }, 'rejects invalid content area format');
        t.match(validateMetadata(img, { content: [ 1, 2, 3, 4, 5 ] }),
        { message: 'image content area must be an array of 4 numbers' }, 'rejects invalid content area format');
    t.match(validateMetadata(img, { content: [ 1, 2, 3, true ] }),
        { message: 'image content area must be an array of 4 numbers' }, 'rejects invalid content area format');

    t.match(validateMetadata(img, { content: [ 4, 4, 4, 4 ] }),
        { message: 'image content area must be positive' }, 'rejects invalid content area size');
    t.match(validateMetadata(img, { content: [ 4, 4, 2, 2 ] }),
        { message: 'image content area must be positive' }, 'rejects invalid content area size');
    t.match(validateMetadata(img, { content: [ 0, 0, 25, 18 ] }),
        { message: 'image content area must be within image bounds' }, 'rejects invalid content area size');
    t.match(validateMetadata(img, { content: [ 0, 0, 24, 19 ] }),
        { message: 'image content area must be within image bounds' }, 'rejects invalid content area size');
    t.match(validateMetadata(img, { content: [ -1, 0, 24, 18 ] }),
        { message: 'image content area must be within image bounds' }, 'rejects invalid content area size');
    t.match(validateMetadata(img, { content: [ 0, -1, 24, 18 ] }),
        { message: 'image content area must be within image bounds' }, 'rejects invalid content area size');

    t.match(validateMetadata(img, { 'stretch-x': {} }),
        { message: 'image stretch-x zones must be an array' }, 'rejects invalid stretch-x format');
    t.match(validateMetadata(img, { 'stretch-x': [ 'yes' ] }),
        { message: 'image stretch-x zone must consist of two numbers' }, 'rejects invalid stretch-x format');
    t.match(validateMetadata(img, { 'stretch-x': [ [] ] }),
        { message: 'image stretch-x zone must consist of two numbers' }, 'rejects invalid stretch-x format');
    t.match(validateMetadata(img, { 'stretch-x': [ [ 4, 4, 4 ] ] }),
        { message: 'image stretch-x zone must consist of two numbers' }, 'rejects invalid stretch-x format');
    t.match(validateMetadata(img, { 'stretch-x': [ [ 4, 5 ], [ 6, null ] ] }),
        { message: 'image stretch-x zone must consist of two numbers' }, 'rejects invalid stretch-x format');

    t.match(validateMetadata(img, { 'stretch-x': [ [ 4, 4 ] ] }),
        { message: 'image stretch-x zone may not be zero-size' }, 'rejects invalid stretch-x size');
    t.match(validateMetadata(img, { 'stretch-x': [ [ 8, 4 ] ] }),
        { message: 'image stretch-x zone may not be zero-size' }, 'rejects invalid stretch-x size');
    t.match(validateMetadata(img, { 'stretch-x': [ [ -2, 2 ] ] }),
        { message: 'image stretch-x zone must be within image bounds' }, 'rejects invalid stretch-x size');
    t.match(validateMetadata(img, { 'stretch-x': [ [ 0, 25 ] ] }),
        { message: 'image stretch-x zone must be within image bounds' }, 'rejects invalid stretch-x size');
    t.match(validateMetadata(img, { 'stretch-x': [ [ 0, 24.999 ] ] }),
        { message: 'image stretch-x zone must be within image bounds' }, 'rejects invalid stretch-x size');

    t.match(validateMetadata(img, { 'stretch-x': [ [ 0, 2 ], [ 1, 3 ] ] }),
        { message: 'image stretch-x zones may not overlap' }, 'rejects overlapping stretch-x zones');
    t.match(validateMetadata(img, { 'stretch-x': [ [ 0, 24 ], [ 8, 16 ] ] }),
        { message: 'image stretch-x zones may not overlap' }, 'rejects overlapping stretch-x zones');
    t.match(validateMetadata(img, { 'stretch-x': [ [ 18, 24 ], [ 0, 6 ] ] }),
        { message: 'image stretch-x zones may not overlap' }, 'rejects unsorted stretch-x zones');

    t.end();
});
