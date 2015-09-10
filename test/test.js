var test = require('tape'),
    fs = require('fs'),
    glob = require('glob'),
    path = require('path'),
    spritezero = require('../');

var update = !!process.env.UPDATE;

function getFixtures() {
    return glob.sync(path.resolve(path.join(__dirname, '/fixture/svg/*.svg')))
        .map(function(im) {
            return {
                svg: fs.readFileSync(im),
                id: path.basename(im).replace('.svg', '')
            };
        }).sort(function(a, b) {
            return b.id < a.id;
        });
}

test('generateLayout', function(t) {
    spritezero.generateLayout(getFixtures(), 1, false, function(err, layout) {
        t.ifError(err);
        t.equal(layout.items.length, 359);
        t.equal(layout.items[0].x, 0);
        t.equal(layout.items[0].y, 0);
        t.end();
    });
});

test('generateImage', function(t) {
    [1, 2, 4].forEach(function(scale) {
        t.test('@' + scale, function(tt) {
            var pngPath = path.resolve(path.join(__dirname, 'fixture/sprite@' + scale + '.png'));
            var jsonPath = path.resolve(path.join(__dirname, 'fixture/sprite@' + scale + '.json'));
            spritezero.generateLayout(getFixtures(), scale, true, function(err, formatted) {
                t.ifError(err);
                spritezero.generateLayout(getFixtures(), scale, false, function(err, layout) {
                    t.ifError(err);
                    if (update) fs.writeFileSync(jsonPath, JSON.stringify(formatted, null, 2));
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
});

test('generateLayout with empty input', function(t) {
    spritezero.generateLayout([], 1, true, function(err, layout) {
        t.ifError(err);
        t.deepEqual(layout, {});
        t.end();
    });
});

test('generateImage with empty input', function(t) {
    spritezero.generateLayout([], 1, false, function(err, layout) {
        t.ifError(err);
        spritezero.generateImage(layout, function(err, sprite) {
            t.notOk(err, 'no error');
            t.ok(sprite, 'produces image');
            t.equal(typeof sprite, 'object');
            t.end();
        });
    });
});
