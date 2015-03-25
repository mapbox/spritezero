var test = require('tape'),
    fs = require('fs'),
    glob = require('glob'),
    path = require('path'),
    spritezero = require('../');

var update = !!process.env.UPDATE;

function getFixtures() {
    return glob.sync(path.resolve(path.join(__dirname, '/fixture/maki/*2x.png')))
        .map(function(im) {
            var isRetina = im.indexOf('@2x') !== -1;
            return {
                buffer: fs.readFileSync(im),
                pixelRatio: isRetina ? 2 : 1,
                id: path.basename(im).replace('.png', '').replace('@2x', '')
            };
        });
}

test('decodeImage', function(t) {
    var res = spritezero.decodeImage(getFixtures()[0]);
    t.equal(res.width, 24);
    t.equal(res.height, 24);
    t.ok(res.image, 'image');
    t.end();
});

test('generateLayout', function(t) {
    var layout = spritezero.generateLayout(getFixtures()
        .map(spritezero.decodeImage));
    t.equal(layout.items.length, 351);

    t.equal(layout.items[0].x, 0);
    t.equal(layout.items[0].y, 0);

    t.equal(layout.items[1].x, 48);
    t.equal(layout.items[1].y, 0);

    t.equal(layout.items[2].x, 0);
    t.equal(layout.items[2].y, 48);
    t.end();
});

test('generateImage', function(t) {
    var pngPath = path.resolve(path.join(__dirname, 'fixture/sprite.png'));
    var jsonPath = path.resolve(path.join(__dirname, 'fixture/sprite.json'));
    var layout = spritezero.generateLayout(getFixtures()
        .map(spritezero.decodeImage));

    var formatted = spritezero.formatLayout(layout);
    if (update) fs.writeFileSync(jsonPath, JSON.stringify(formatted, null, 2));
    t.deepEqual(formatted, JSON.parse(fs.readFileSync(jsonPath)));

    spritezero.generateImage(layout, function(err, res) {
        t.notOk(err, 'no error');
        t.ok(res, 'produces image');
        if (update) fs.writeFileSync(pngPath, res);
        t.deepEqual(res, fs.readFileSync(pngPath));
        t.end();
    });
});
