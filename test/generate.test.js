const fs = require('fs');
const glob = require('glob');
const path = require('path');
const queue = require('d3-queue').queue;
const stringify = require('json-stable-stringify');
const spritezero = require('../');
const mapnik = require('mapnik');

// eslint-disable-next-line no-process-env
var update = process.env.UPDATE;
var emptyPNG = new mapnik.Image(1, 1).encodeSync('png');

const fixtures = glob.sync(path.resolve(path.join(__dirname, '/fixture/svg/*.svg'))).map(function(im) {
    return {
        svg: fs.readFileSync(im),
        id: path.basename(im).replace('.svg', '')
    };
});

test('generateLayout', () => {
    spritezero.generateLayout({ imgs: fixtures, pixelRatio: 1, format: false }, function(err, layout) {
        expect(err).toBeFalsy();
        expect(layout.items.length).toBe(362);
        expect(layout.items[0].x).toBe(0);
        expect(layout.items[0].y).toBe(0);
    });
});

test('generateLayout with icon size filter', () => {
    spritezero.generateLayout({ imgs: fixtures, pixelRatio: 1, format: false, removeOversizedIcons: true, maxIconSize: 15 }, function(err, layout) {
        expect(err).toBeFalsy();
        expect(layout.items.length).toBe(119);
        expect(layout.items[0].x).toBe(0);
        expect(layout.items[0].y).toBe(0);
    });
});

test('generateLayout bench (concurrency=1,x10)', () => {
    var start = +new Date();
    var q = queue(1);
    for (var i = 0; i < 10; i++) q.defer(spritezero.generateLayout, { imgs: fixtures, pixelRatio: 1, format: false });
    q.awaitAll(function(err) {
        expect(err).toBeFalsy();
        expect(true,`${new Date() - start}ms`).toBeTruthy();
    });
});

test('generateLayout bench (concurrency=4,x20)', () => {
    var start = +new Date();
    var q = queue(4);
    for (var i = 0; i < 20; i++) q.defer(spritezero.generateLayout, { imgs: fixtures, pixelRatio: 1, format: false });
    q.awaitAll(function(err) {
        expect(err).toBeFalsy();
        expect(true,`${new Date() - start}ms`).toBeTruthy();
    });
});

test('generateLayoutUnique', () => {
    spritezero.generateLayoutUnique({ imgs: fixtures, pixelRatio: 1, format: false }, function(err, layout) {
        expect(err).toBeFalsy();
        // unique-24.svg and unique-24-copy.svg are unique
        expect(layout.items.length).toBe(361);
        expect(layout.items[0].x).toBe(0);
        expect(layout.items[0].y).toBe(0);
        
    });
});

test('generateLayout', () => {
    spritezero.generateLayout({ imgs: fixtures, pixelRatio: 1, format: true }, function(err, formatted) {
        expect(err).toBeFalsy();
        expect(Object.keys(formatted).length).toBe(362);
        // unique-24.svg and unique-24-copy.svg are NOT deduped
        // so the json references different x/y
        expect(formatted['unique-24']).not.toStrictEqual(formatted['unique-24-copy']);
    });
});

test('generateLayoutUnique', () => {
    spritezero.generateLayoutUnique({ imgs: fixtures, pixelRatio: 1, format: true }, function(err, formatted) {
        expect(err).toBeFalsy();
        // unique-24.svg and unique-24-copy.svg are deduped into a single one
        // but the json still references both, so still 362
        expect(Object.keys(formatted).length).toBe(362);
        // should be same x/y
        expect(formatted['unique-24']).toStrictEqual(formatted['unique-24-copy']);
        
    });
});

test.each([1,2,4])('generateImage - sprite@%i', (scale) => {   
    var pngPath = path.resolve(path.join(__dirname, 'fixture/sprite@' + scale + '.png'));
    var jsonPath = path.resolve(path.join(__dirname, 'fixture/sprite@' + scale + '.json'));
    spritezero.generateLayout({ imgs: fixtures, pixelRatio: scale, format: true }, function(err, formatted) {
        expect(err).toBeFalsy();
        spritezero.generateLayout({ imgs: fixtures, pixelRatio: scale, format: false }, function(err, layout) {
            expect(err).toBeFalsy();
            if (update) fs.writeFileSync(jsonPath, stringify(formatted, { space: '  ' }));
            expect(formatted).toStrictEqual(JSON.parse(fs.readFileSync(jsonPath)));
            spritezero.generateImage(layout, function(err, res) {
                expect(err).toBeFalsy();
                expect(res).toBeTruthy();
                if (update) fs.writeFileSync(pngPath, res);
                expect(Math.abs(res.length - fs.readFileSync(pngPath).length)).toBeLessThan(1000);
            });
        });
    });
});


// Generating both a valid layout and image in one pass
test.each([1,2,4])('generateOptimizeImage with format:true - sprite@%i', (scale) => {
    var optimizedPngPath = path.resolve(path.join(__dirname, 'fixture/sprite@' + scale + '-64colors.png'));
    spritezero.generateLayout({ imgs: fixtures, pixelRatio: scale, format: true }, function(err, dataLayout, imageLayout) {
        expect(err).toBeFalsy();
        expect(dataLayout).toBeDefined();
        expect(imageLayout).toBeDefined();
        spritezero.generateOptimizedImage(imageLayout, {quality: 64}, function(err, res) {
            expect(err).toBeFalsy();
            expect(res).toBeDefined();
            if (update) fs.writeFileSync(optimizedPngPath, res);
            expect(Math.abs(res.length - fs.readFileSync(optimizedPngPath).length)).toBeLessThan(1000);
        });
    });
});

test.each([1,2,4])('generateOptimizeImage with format:true - unique - sprite@%i', (scale) => {
    var optimizedPngPath = path.resolve(path.join(__dirname, 'fixture/sprite-uniq@' + scale + '-64colors.png'));
    spritezero.generateLayoutUnique({ imgs: fixtures, pixelRatio: scale, format: true }, function(err, dataLayout, imageLayout) {
        expect(err).toBeFalsy();
        expect(dataLayout).toBeDefined();
        expect(imageLayout).toBeDefined();
        spritezero.generateOptimizedImage(imageLayout, {quality: 64}, function(err, res) {
            expect(err).toBeFalsy();
            expect(res).toBeDefined();
            if (update) fs.writeFileSync(optimizedPngPath, res);
            expect(Math.abs(res.length - fs.readFileSync(optimizedPngPath).length)).toBeLessThan(1000);
        });
    });
});

test.each([1,2,4])('generateImage - unique - sprite-uniq@%i', (scale) => {
    var pngPath = path.resolve(path.join(__dirname, 'fixture/sprite-uniq@' + scale + '.png'));
    var jsonPath = path.resolve(path.join(__dirname, 'fixture/sprite-uniq@' + scale + '.json'));
    spritezero.generateLayoutUnique({ imgs: fixtures, pixelRatio: scale, format: true }, function(err, formatted) {
        expect(err).toBeFalsy();
        spritezero.generateLayoutUnique({ imgs: fixtures, pixelRatio: scale, format: false }, function(err, layout) {
            expect(err).toBeFalsy();
            if (update) fs.writeFileSync(jsonPath, stringify(formatted, { space: '  ' }));
            expect(formatted).toStrictEqual(JSON.parse(fs.readFileSync(jsonPath)));

            spritezero.generateImage(layout, function(err, res) {
                expect(err).toBeFalsy();
                expect(res).toBeDefined();
                if (update) fs.writeFileSync(pngPath, res);
                expect(Math.abs(res.length - fs.readFileSync(pngPath).length)).toBeLessThan(1000);
            });
        });
    });
});


test('generateLayout with empty input', () => {
    spritezero.generateLayout({ imgs: [], pixelRatio: 1, format: true }, function(err, layout) {
        expect(err).toBeFalsy();
        expect(layout).toStrictEqual({}); 
    });
});

test('generateLayoutUnique with empty input', () => {
    spritezero.generateLayoutUnique({ imgs: [], pixelRatio: 1, format: true }, function(err, layout) {
        expect(err).toBeFalsy();
        expect(layout).toStrictEqual({}); 
    });
});

test('generateImage with empty input', () => {
    spritezero.generateLayout({ imgs: [], pixelRatio: 1, format: false }, function(err, layout) {
        expect(err).toBeFalsy();
        spritezero.generateImage(layout, function(err, sprite) {
            expect(err).toBeFalsy();
            expect(sprite).toBeDefined();
            expect(sprite).toEqual(expect.any(Object));
        });
    });
});

test('generateImage unique with empty input', () => {
    spritezero.generateLayoutUnique({ imgs: [], pixelRatio: 1, format: false }, function(err, layout) {
        expect(err).toBeFalsy();
        spritezero.generateImage(layout, function(err, sprite) {
            expect(err).toBeFalsy();
            expect(sprite).toBeDefined();
            expect(sprite).toEqual(expect.any(Object));
        });
    });
});

test('generateImage unique with max_size', () => {
    spritezero.generateLayoutUnique({ imgs: fixtures, pixelRatio: 1, format: false, maxIconSize: 10 }, function(err, layout) {
        expect(err).toBeDefined();
        expect(layout).toBeUndefined();
        expect(err.message).toBe('image created from svg must be 10 pixels or fewer on each side');
    });
});

test('generateLayout relative width/height SVG returns empty', () => {
    var fixtures = [
      {
        id: 'relative-dimensions',
        svg: fs.readFileSync('./test/fixture/relative-dimensions.svg')
      },
      {
        id: 'art',
        svg: fs.readFileSync('./test/fixture/svg/art-gallery-18.svg')
      }
    ];

    spritezero.generateLayout({ imgs: fixtures, pixelRatio: 1, format: true }, function(err, formatted) {
        expect(err).toBeFalsy();
        expect(formatted).toStrictEqual({ art: { width: 18, height: 18, x: 0, y: 0, pixelRatio: 1 } });
    });
});

test('generateLayout only relative width/height SVG returns empty sprite object', () => {
    var fixtures = [
      {
        id: 'relative-dimensions',
        svg: fs.readFileSync('./test/fixture/relative-dimensions.svg')
      }
    ];

    spritezero.generateLayout({ imgs: fixtures, pixelRatio: 1, format: false }, function(err, layout) {
        expect(err).toBeFalsy();
        expect(layout).toStrictEqual({ width: 0, height: 0, items: []});

        spritezero.generateImage(layout, function(err, image) {
            expect(err).toBeFalsy();
            expect(image).toStrictEqual(emptyPNG);
        });
    });
});

test('generateLayout containing image with no width or height SVG', () => {
    var fixtures = [
      {
        id: 'no-width-or-height',
        svg: fs.readFileSync('./test/fixture/no-width-or-height.svg')
      },
      {
        id: 'art',
        svg: fs.readFileSync('./test/fixture/svg/art-gallery-18.svg')
      }
    ];

    // 'only "art" is in layout'
    spritezero.generateLayout({ imgs: fixtures, pixelRatio: 1, format: true }, function(err, formatted) {
        expect(err).toBeFalsy();
        expect(formatted).toStrictEqual({ art: { width: 18, height: 18, x: 0, y: 0, pixelRatio: 1 } });
    });
});

test('generateLayout containing only image with no width or height', () => {
    var fixtures = [
        {
          id: 'no-width-or-height',
          svg: fs.readFileSync('./test/fixture/no-width-or-height.svg')
        }
      ];

      spritezero.generateLayout({ imgs: fixtures, pixelRatio: 1, format: false }, function(err, layout) {
          expect(err).toBeFalsy();
          expect(layout, 'empty layout').toStrictEqual({ width: 0, height: 0, items: []});

          spritezero.generateImage(layout, function(err, image) {
              expect(err).toBeFalsy();
              expect(image).toStrictEqual(emptyPNG); 
          });
      });
});

test('generateLayout with extractMetadata option set to false', () => {
    var fixtures = [
        {
            id: 'cn',
            svg: fs.readFileSync('./test/fixture/svg-metadata/cn-nths-expy-2-affinity.svg')
        }
    ];

    spritezero.generateLayout({ imgs: fixtures, pixelRatio: 1, format: true, extractMetadata: false }, function (err, formatted) {
        expect(err).toBeFalsy();
        expect(formatted).toStrictEqual({ cn: { width: 20, height: 23, x: 0, y: 0, pixelRatio: 1 } });
    });
});

test('generateLayout without extractMetadata option set (defaults to true)', () => {
    var fixtures = [
        {
            id: 'cn',
            svg: fs.readFileSync('./test/fixture/svg-metadata/cn-nths-expy-2-affinity.svg')
        }
    ];

    spritezero.generateLayout({ imgs: fixtures, pixelRatio: 1, format: true }, function (err, formatted) {
        expect(err).toBeFalsy();
        expect(formatted).deepEqual({ cn: { width: 20, height: 23, x: 0, y: 0, pixelRatio: 1, content: [2, 5, 18, 18], stretchX: [[4, 16]], stretchY: [[5, 16]] } }); 
    });
});

test('generateLayout without extractMetadata option set (defaults to true) when generating an image layout (format set to false)', () => {
    var fixtures = [
        {
            id: 'cn',
            svg: fs.readFileSync('./test/fixture/svg-metadata/cn-nths-expy-2-affinity.svg')
        }
    ];

    spritezero.generateLayout({ imgs: fixtures, pixelRatio: 1, format: false }, function (err, formatted) {
        expect(err).toBeFalsy();
        expect(formatted.items[0].stretchX).toBeUndefined();
    });
});

test('generateLayout with both placeholder and stretch zone', () => {
    var fixtures = [
        {
            id: 'au-national-route-5',
            svg: fs.readFileSync('./test/fixture/svg-metadata/au-national-route-5.svg')
        }
    ];
    spritezero.generateLayout({ imgs: fixtures, pixelRatio: 1, format: true }, function (err, formatted) {
        expect(err).toBeFalsy();
        expect(formatted).toStrictEqual(
            {
                'au-national-route-5': {
                    width: 38,
                    height: 20,
                    x: 0,
                    y: 0,
                    pixelRatio: 1,
                    content: [3, 7, 23, 18],
                    stretchX: [[5, 7]],
                    placeholder: [0, 7, 38, 13]
                }
            }
        );
    });
});
