var test = require('tape'),
    fs = require('fs'),
    glob = require('glob'),
    path = require('path'),
    spritezero = require('../');

var update = !!process.env.UPDATE;

function getFixtures() {
    return glob.sync(path.resolve(path.join(__dirname, '/fixture/maki/*.svg')))
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
    var layout = spritezero.generateLayout(getFixtures());
    t.equal(layout.items.length, 358);
    t.equal(layout.items[0].x, 0);
    t.equal(layout.items[0].y, 0);
    t.end();
});

test('generateImage', function(t) {
    var pngPath = path.resolve(path.join(__dirname, 'fixture/sprite.png'));
    var jsonPath = path.resolve(path.join(__dirname, 'fixture/sprite.json'));
    var formatted = spritezero.generateLayout(getFixtures(), true);
    var layout = spritezero.generateLayout(getFixtures());
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
