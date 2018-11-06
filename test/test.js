var test = require('tap').test,
    fs = require('fs'),
    glob = require('glob'),
    path = require('path'),
    queue = require('queue-async'),
    stringify = require('json-stable-stringify'),
    spritezero = require('../');

// eslint-disable-next-line no-process-env
var update = process.env.UPDATE;

function getFixtures() {
    return glob.sync(path.resolve(path.join(__dirname, '/fixture/svg/*.svg')))
        .map(function(im) {
            return {
                svg: fs.readFileSync(im),
                id: path.basename(im).replace('.svg', '')
            };
        }).sort(function() {
            return Math.random() - 0.5;
        });
}

test('generateLayout and generateManifest', function(t) {
    spritezero.generateLayout({ imgs: getFixtures(), pixelRatio: 1 }, function(err, layout) {
        t.ifError(err);
        t.equal(layout.items.length, 362);
        t.equal(layout.items[0].x, 0);
        t.equal(layout.items[0].y, 0);

        // unique-24.svg and unique-24-copy.svg are NOT deduped
        // so the json references different x/y
        var formatted = spritezero.generateManifest(layout);
        t.notDeepEqual(formatted['unique-24'], formatted['unique-24-copy']);
        t.end();
    });
});

test('generateLayout with icon size filter', function(t) {
    spritezero.generateLayout({ imgs: getFixtures(), pixelRatio: 1, removeOversizedIcons: true, maxIconSize: 15 }, function(err, layout) {
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
    for (var i = 0; i < 10; i++) q.defer(spritezero.generateLayout, { imgs: getFixtures(), pixelRatio: 1 });
    q.awaitAll(function(err) {
        t.ifError(err);
        t.ok(true, (+new Date() - start) + 'ms');
        t.end();
    });
});

test('generateLayout bench (concurrency=4,x20)', function(t) {
    var start = +new Date();
    var q = queue(4);
    for (var i = 0; i < 20; i++) q.defer(spritezero.generateLayout, { imgs: getFixtures(), pixelRatio: 1 });
    q.awaitAll(function(err) {
        t.ifError(err);
        t.ok(true, (+new Date() - start) + 'ms');
        t.end();
    });
});

test('generateLayout with deduplication', function(t) {
    spritezero.generateLayout({ imgs: getFixtures(), pixelRatio: 1, unique: true }, function(err, layout) {
        t.ifError(err);
        // unique-24.svg and unique-24-copy.svg are unique
        t.equal(layout.items.length, 361);
        t.equal(layout.items[0].x, 0);
        t.equal(layout.items[0].y, 0);
        var formatted = spritezero.generateManifest(layout);
        // unique-24.svg and unique-24-copy.svg are deduped into a single one
        // but the json still references both, so still 362
        t.equals(Object.keys(formatted).length, 362);
        // should be same x/y
        t.deepEqual(formatted['unique-24'], formatted['unique-24-copy']);
        t.end();
    });
});

test('generateImage', function(t) {
    [false, true].forEach(function(unique) {
        [1, 2, 4].forEach(function(scale) {
            t.test('unique = ' + unique + ', @' + scale, function(tt) {
                var prefix = unique ? 'fixture/sprite-uniq@' : 'fixture/sprite@';
                var pngPath = path.resolve(path.join(__dirname, prefix + scale + '.png'));
                var jsonPath = path.resolve(path.join(__dirname, prefix + scale + '.json'));
                spritezero.generateLayout({ imgs: getFixtures(), pixelRatio: scale, unique: unique }, function(err, layout) {
                    tt.ifError(err);
                    var formatted = spritezero.generateManifest(layout);
                    if (update) fs.writeFileSync(jsonPath, stringify(formatted, { space: '  ' }));
                    tt.deepEqual(formatted, JSON.parse(fs.readFileSync(jsonPath)));

                    spritezero.generateImage(layout, function(err, res) {
                        tt.notOk(err, 'no error');
                        tt.ok(res, 'produces image');
                        if (update) fs.writeFileSync(pngPath, res);
                        tt.deepEqual(res, fs.readFileSync(pngPath));
                        tt.end();
                    });
                });
            });
        });
    });
    t.end();
});

test('embedManifest and extractManifest', function(t) {
    [1, 2, 4].forEach(function(scale) {
        t.test('@' + scale, function(tt) {
            spritezero.generateLayout({ imgs: getFixtures(), pixelRatio: 1 }, function(err, layout) {
                tt.ifError(err);
                spritezero.generateImage(layout, function(err, sprite) {
                    tt.ifError(err);
                    var manifest = spritezero.generateManifest(layout);
                    var embedded = spritezero.embedManifest(manifest, sprite);
                    tt.ok(embedded);

                    var pngPath = path.resolve(path.join(__dirname, 'fixture/sprite-embedded@' + scale + '.png'));
                    if (update) fs.writeFileSync(pngPath, embedded);
                    var existing = fs.readFileSync(pngPath);
                    tt.deepEqual(embedded, existing);

                    var extracted = spritezero.extractManifest(existing);
                    tt.deepEqual(manifest, extracted);
                    tt.end();
                });
            });
        });
    });
    t.end();
});

test('generateLayout with empty input', function(t) {
    [false, true].forEach(function(unique) {
        t.test('unique = ' + unique, function(tt) {
            spritezero.generateLayout({ imgs: [], pixelRatio: 1, unique: unique }, function(err, layout) {
                tt.ifError(err);
                tt.deepEqual(layout, {
                    width: 1,
                    height: 1,
                    pixelRatio: 1,
                    items: []
                });
                var formatted = spritezero.generateManifest(layout);
                tt.deepEqual(formatted, {});
                tt.end();
            });
        });
    });
    t.end();
});

test('generateImage with empty input', function(t) {
    [false, true].forEach(function(unique) {
        t.test('unique = ' + unique, function(tt) {
            spritezero.generateLayout({ imgs: [], pixelRatio: 1, unique: unique }, function(err, layout) {
                tt.ifError(err);
                spritezero.generateImage(layout, function(err, sprite) {
                    tt.notOk(err, 'no error');
                    tt.ok(sprite, 'produces image');
                    tt.equal(typeof sprite, 'object');
                    tt.end();
                });
            });
        });
    });
    t.end();
});

test('generateImage unique with max_size', function(t) {
    spritezero.generateLayout({ imgs: getFixtures(), pixelRatio: 1, maxIconSize: 10, unique: true }, function(err, layout) {
        t.ok(err);
        t.notOk(layout);
        t.equal(err.message, 'image created from svg must be 10 pixels or fewer on each side');
        t.end();
    });
});
