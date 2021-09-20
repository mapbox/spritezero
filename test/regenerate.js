const spritezero = require('..');
const fs = require('fs');
const path = require('path');
const queue = require('d3-queue').queue;

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
    [spritezero.generateLayout, spritezero.generateLayoutUnique].forEach(function (fn, unique) {
        [1, 2, 4].forEach(function (ratio) {
                fn({ imgs: buffers, pixelRatio: ratio, format: true }, function (err, formattedLayout) {
                    if (err) throw err;
                    fs.writeFile(
                        path.resolve(__dirname, 'fixture', `sprite${unique ? '-uniq' : ''}@${ratio}.json`),
                        JSON.stringify(formattedLayout, null, 2),
                        'utf8',
                        function (err) {
                            if (err) throw err;
                        }
                    );
                });
                fn({ imgs: buffers, pixelRatio: ratio }, function (err, layout) {
                    if (err) throw err;
                    spritezero.generateImage(layout, function (err, image) {
                        if (err) throw err;
                        fs.writeFile(
                            path.resolve(__dirname, 'fixture', `sprite${unique ? '-uniq' : ''}@${ratio}.png`),

                            image,
                            function (err) {
                                if (err) throw err;
                            }
                        );
                    });
                });
            });
    });
    
});
