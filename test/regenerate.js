var spritezero = require('..');
var fs = require('fs');
var path = require('path');
var queue = require('queue-async');

function filepaths (dir) {
    return fs.readdirSync(dir)
        .filter(function (d) {
            return !d.match(/^\./);
        })
        .map(function (d) {
            return path.join(dir, d);
        });
}

function loadFile (file, callback) {
    fs.readFile(file, function (err, res) {
        return callback(err, {
            svg: res,
            id: path.basename(file).replace('.svg', '')
        });
    });
}

var q = queue(16);

filepaths(path.resolve(__dirname, 'fixture', 'svg')).forEach(function (file) {
    q.defer(loadFile, file);
});

q.awaitAll(function (err, buffers) {
    [1, 2, 4].forEach(function (ratio) {
        spritezero.generateLayout({ imgs: buffers, pixelRatio: ratio, unique: true }, function (err, formattedLayout) {
            if (err) throw err;
            fs.writeFile(
                path.resolve(__dirname, 'fixture', 'sprite@' + ratio + '.json'),
                JSON.stringify(formattedLayout, null, 2),
                'utf8',
                function (err) {
                    if (err) throw err;
                }
            );
        });
        spritezero.generateLayout({ imgs: buffers, pixelRatio: ratio, unique: false }, function (err, layout) {
            if (err) throw err;
            spritezero.generateImage(layout, function (err, image) {
                if (err) throw err;
                fs.writeFile(
                    path.resolve(__dirname, 'fixture', 'sprite@' + ratio + '.png'),
                    image,
                    function (err) {
                        if (err) throw err;
                    }
                );
            });
        });
    });
});
