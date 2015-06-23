var queue = require('queue-async'),
    path = require('path'),
    fs = require('fs'),
    glob = require('glob'),
    spritezero = require('./index.js'),
    spritezero2 = require('./index2.js');

function getFixtures() {
    return glob.sync(path.resolve(path.join('test/fixture/maki/*.svg')))
        .map(function(im) {
            return {
                svg: fs.readFileSync(im),
                id: path.basename(im).replace('.svg', '')
            };
        }).sort(function(a, b) {
            return b.id < a.id;
        });
}

var count = 20;
var scale = 4;

var fixtures = getFixtures();

function run(mod, callback) {
    var formatted = mod.generateLayout(getFixtures(), scale, true);
    var layout = mod.generateLayout(getFixtures(), scale);
    mod.generateImage(layout, function(err, res) {
        callback();
    });
}

var q1 = queue();
console.time('blend');
for (var i = 0; i < count; i++) {
    q1.defer(run, spritezero);
}

q1.awaitAll(function() {
    console.timeEnd('blend');


    var q2 = queue();
    console.time('composite');
    for (var j = 0; j < count; j++) {
        q2.defer(run, spritezero2);
    }
    q2.awaitAll(function() {
        console.timeEnd('composite');
    });

});
