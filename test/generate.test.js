var test = require('tap').test,
    fs = require('fs'),
    glob = require('glob'),
    path = require('path'),
    queue = require('queue-async'),
    stringify = require('json-stable-stringify'),
    spritezero = require('../'),
    mapnik = require('mapnik');

// eslint-disable-next-line no-process-env
var update = process.env.UPDATE;
var emptyPNG = new mapnik.Image(1, 1).encodeSync('png');

const fixtures = glob.sync(path.resolve(path.join(__dirname, '/fixture/svg/*.svg'))).map(function(im) {
    return {
        svg: fs.readFileSync(im),
        id: path.basename(im).replace('.svg', '')
    };
});

function getFixtures() {
    return fixtures.sort(function() {
        return Math.random() - 0.5;
    });
}

test('generateLayout', function(t) {
    spritezero.generateLayout({ imgs: getFixtures(), pixelRatio: 1, format: false }, function(err, layout) {
        t.ifError(err);
        t.equal(layout.items.length, 362);
        t.equal(layout.items[0].x, 0);
        t.equal(layout.items[0].y, 0);
        t.end();
    });
});

test('generateLayout with icon size filter', function(t) {
    spritezero.generateLayout({ imgs: getFixtures(), pixelRatio: 1, format: false, removeOversizedIcons: true, maxIconSize: 15 }, function(err, layout) {
        t.ifError(err);
        t.equal(layout.items.length, 119);
        t.equal(layout.items[0].x, 0);
        t.equal(layout.items[0].y, 0);
        t.end();
    });
});

test('generateLayout bench (concurrency=1,x10)', function(t) {
    var start = +new Date();
    var q = queue(1);
    for (var i = 0; i < 10; i++) q.defer(spritezero.generateLayout, { imgs: getFixtures(), pixelRatio: 1, format: false });
    q.awaitAll(function(err) {
        t.ifError(err);
        t.ok(true, (+new Date() - start) + 'ms');
        t.end();
    });
});

test('generateLayout bench (concurrency=4,x20)', function(t) {
    var start = +new Date();
    var q = queue(4);
    for (var i = 0; i < 20; i++) q.defer(spritezero.generateLayout, { imgs: getFixtures(), pixelRatio: 1, format: false });
    q.awaitAll(function(err) {
        t.ifError(err);
        t.ok(true, (+new Date() - start) + 'ms');
        t.end();
    });
});

test('generateLayoutUnique', function(t) {
    spritezero.generateLayoutUnique({ imgs: getFixtures(), pixelRatio: 1, format: false }, function(err, layout) {
        t.ifError(err);
        // unique-24.svg and unique-24-copy.svg are unique
        t.equal(layout.items.length, 361);
        t.equal(layout.items[0].x, 0);
        t.equal(layout.items[0].y, 0);
        t.end();
    });
});

test('generateLayout', function(t) {
    spritezero.generateLayout({ imgs: getFixtures(), pixelRatio: 1, format: true }, function(err, formatted) {
        t.ifError(err);
        t.equals(Object.keys(formatted).length, 362);
        // unique-24.svg and unique-24-copy.svg are NOT deduped
        // so the json references different x/y
        t.notDeepEqual(formatted['unique-24'], formatted['unique-24-copy']);
        t.end();
    });
});

test('generateLayoutUnique', function(t) {
    spritezero.generateLayoutUnique({ imgs: getFixtures(), pixelRatio: 1, format: true }, function(err, formatted) {
        t.ifError(err);
        // unique-24.svg and unique-24-copy.svg are deduped into a single one
        // but the json still references both, so still 362
        t.equals(Object.keys(formatted).length, 362);
        // should be same x/y
        t.deepEqual(formatted['unique-24'], formatted['unique-24-copy']);
        t.end();
    });
});

test('generateImage', function(t) {
    [1, 2, 4].forEach(function(scale) {
        t.test('@' + scale, function(tt) {
            var pngPath = path.resolve(path.join(__dirname, 'fixture/sprite@' + scale + '.png'));
            var jsonPath = path.resolve(path.join(__dirname, 'fixture/sprite@' + scale + '.json'));
            spritezero.generateLayout({ imgs: getFixtures(), pixelRatio: scale, format: true }, function(err, formatted) {
                tt.ifError(err);
                spritezero.generateLayout({ imgs: getFixtures(), pixelRatio: scale, format: false }, function(err, layout) {
                    tt.ifError(err);
                    if (update) fs.writeFileSync(jsonPath, stringify(formatted, { space: '  ' }));
                    tt.deepEqual(formatted, JSON.parse(fs.readFileSync(jsonPath)));

                    spritezero.generateImage(layout, function(err, res) {
                        tt.notOk(err, 'no error');
                        tt.ok(res, 'produces image');
                        if (update) fs.writeFileSync(pngPath, res);
                        tt.ok(Math.abs(res.length - fs.readFileSync(pngPath).length) < 1000);
                        tt.end();
                    });
                });
            });
        });
    });
    t.end();
});

// Generating both a valid layout and image in one pass
test('generateImage with format:true', function(t) {
    [1, 2, 4].forEach(function(scale) {
        t.test('@' + scale, function(tt) {
            var optimizedPngPath = path.resolve(path.join(__dirname, 'fixture/sprite@' + scale + '-64colors.png'));
            spritezero.generateLayout({ imgs: getFixtures(), pixelRatio: scale, format: true }, function(err, dataLayout, imageLayout) {
                tt.ifError(err);
                tt.ok(dataLayout);
                tt.ok(imageLayout);
                spritezero.generateOptimizedImage(imageLayout, {quality: 64}, function(err, res) {
                    tt.notOk(err, 'no error');
                    tt.ok(res, 'produces image');
                    if (update) fs.writeFileSync(optimizedPngPath, res);
                    tt.ok(Math.abs(res.length - fs.readFileSync(optimizedPngPath).length) < 1000);
                    tt.end();
                });
            });
        });
    });
    t.end();
});

test('generateImageUnique', function(t) {
    [1, 2, 4].forEach(function(scale) {
        t.test('@' + scale, function(tt) {
            var pngPath = path.resolve(path.join(__dirname, 'fixture/sprite-uniq@' + scale + '.png'));
            var jsonPath = path.resolve(path.join(__dirname, 'fixture/sprite-uniq@' + scale + '.json'));
            spritezero.generateLayoutUnique({ imgs: getFixtures(), pixelRatio: scale, format: true }, function(err, formatted) {
                tt.ifError(err);
                spritezero.generateLayoutUnique({ imgs: getFixtures(), pixelRatio: scale, format: false }, function(err, layout) {
                    tt.ifError(err);
                    if (update) fs.writeFileSync(jsonPath, stringify(formatted, { space: '  ' }));
                    tt.deepEqual(formatted, JSON.parse(fs.readFileSync(jsonPath)));

                    spritezero.generateImage(layout, function(err, res) {
                        tt.notOk(err, 'no error');
                        tt.ok(res, 'produces image');
                        if (update) fs.writeFileSync(pngPath, res);
                        tt.ok(Math.abs(res.length - fs.readFileSync(pngPath).length) < 1000);
                        tt.end();
                    });
                });
            });
        });
    });
    t.end();
});

test('generateLayout with empty input', function(t) {
    spritezero.generateLayout({ imgs: [], pixelRatio: 1, format: true }, function(err, layout) {
        t.ifError(err);
        t.deepEqual(layout, {});
        t.end();
    });
});

test('generateLayoutUnique with empty input', function(t) {
    spritezero.generateLayoutUnique({ imgs: [], pixelRatio: 1, format: true }, function(err, layout) {
        t.ifError(err);
        t.deepEqual(layout, {});
        t.end();
    });
});

test('generateImage with empty input', function(t) {
    spritezero.generateLayout({ imgs: [], pixelRatio: 1, format: false }, function(err, layout) {
        t.ifError(err);
        spritezero.generateImage(layout, function(err, sprite) {
            t.notOk(err, 'no error');
            t.ok(sprite, 'produces image');
            t.equal(typeof sprite, 'object');
            t.end();
        });
    });
});

test('generateImage unique with empty input', function(t) {
    spritezero.generateLayoutUnique({ imgs: [], pixelRatio: 1, format: false }, function(err, layout) {
        t.ifError(err);
        spritezero.generateImage(layout, function(err, sprite) {
            t.notOk(err, 'no error');
            t.ok(sprite, 'produces image');
            t.equal(typeof sprite, 'object');
            t.end();
        });
    });
});

test('generateImage unique with max_size', function(t) {
    spritezero.generateLayoutUnique({ imgs: getFixtures(), pixelRatio: 1, format: false, maxIconSize: 10 }, function(err, layout) {
        t.ok(err);
        t.notOk(layout);
        t.equal(err.message, 'image created from svg must be 10 pixels or fewer on each side');
        t.end();
    });
});

test('generateLayout relative width/height SVG returns empty', function(t) {
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
        t.ifError(err);
        t.deepEqual(formatted, { art: { width: 18, height: 18, x: 0, y: 0, pixelRatio: 1 } });
        t.end();
    });
});

test('generateLayout only relative width/height SVG returns empty sprite object', function(t) {
    var fixtures = [
      {
        id: 'relative-dimensions',
        svg: fs.readFileSync('./test/fixture/relative-dimensions.svg')
      }
    ];

    spritezero.generateLayout({ imgs: fixtures, pixelRatio: 1, format: false }, function(err, layout) {
        t.ifError(err);
        t.deepEqual(layout, { width: 1, height: 1, items: []}, 'empty layout');

        spritezero.generateImage(layout, function(err, image) {
            t.ifError(err);
            t.deepEqual(image, emptyPNG, 'empty PNG response');
            t.end();
        });
    });
});

test('generateLayout containing image with no width or height SVG', function(t) {
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

    spritezero.generateLayout({ imgs: fixtures, pixelRatio: 1, format: true }, function(err, formatted) {
        t.ifError(err);
        t.deepEqual(formatted, { art: { width: 18, height: 18, x: 0, y: 0, pixelRatio: 1 } }, 'only "art" is in layout');
        t.end();
    });
});

test('generateLayout containing only image with no width or height', function(t) {
    var fixtures = [
        {
          id: 'no-width-or-height',
          svg: fs.readFileSync('./test/fixture/no-width-or-height.svg')
        }
      ];

      spritezero.generateLayout({ imgs: fixtures, pixelRatio: 1, format: false }, function(err, layout) {
          t.ifError(err);
          t.deepEqual(layout, { width: 1, height: 1, items: []}, 'empty layout');

          spritezero.generateImage(layout, function(err, image) {
              t.ifError(err);
              t.deepEqual(image, emptyPNG, 'empty PNG response');
              t.end();
          });
      });
});

test('generateLayout with extractMetadata option set to false', function (t) {
    var fixtures = [
        {
            id: 'cn',
            svg: fs.readFileSync('./test/fixture/svg-metadata/cn-nths-expy-2-affinity.svg')
        }
    ];

    spritezero.generateLayout({ imgs: fixtures, pixelRatio: 1, format: true, extractMetadata: false }, function (err, formatted) {
        t.ifError(err);
        t.deepEqual(formatted, { cn: { width: 20, height: 23, x: 0, y: 0, pixelRatio: 1 } });
        t.end();
    });
});

test('generateLayout without extractMetadata option set (defaults to true)', function (t) {
    var fixtures = [
        {
            id: 'cn',
            svg: fs.readFileSync('./test/fixture/svg-metadata/cn-nths-expy-2-affinity.svg')
        }
    ];

    spritezero.generateLayout({ imgs: fixtures, pixelRatio: 1, format: true }, function (err, formatted) {
        t.ifError(err);
        t.deepEqual(formatted, { cn: { width: 20, height: 23, x: 0, y: 0, pixelRatio: 1, content: [2, 5, 18, 18], stretchX: [[4, 16]], stretchY: [[5, 16]] } });
        t.end();
    });
});

test('generateLayout without extractMetadata option set (defaults to true) when generating an image layout (format set to false)', function (t) {
    var fixtures = [
        {
            id: 'cn',
            svg: fs.readFileSync('./test/fixture/svg-metadata/cn-nths-expy-2-affinity.svg')
        }
    ];

    spritezero.generateLayout({ imgs: fixtures, pixelRatio: 1, format: false }, function (err, formatted) {
        t.ifError(err);
        t.equal(formatted.items[0].stretchX, undefined);
        t.end();
    });
});

test('generateLayout with both placeholder and stretch zone', function (t) {
    var fixtures = [
        {
            id: 'au-national-route-5',
            svg: fs.readFileSync('./test/fixture/svg-metadata/au-national-route-5.svg')
        }
    ];
    spritezero.generateLayout({ imgs: fixtures, pixelRatio: 1, format: true }, function (err, formatted) {
        t.ifError(err);
        t.deepEqual(
            formatted,
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
        t.end();
    });
});
