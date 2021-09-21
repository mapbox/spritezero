const spritezero = require('..');
const fs = require('fs');
const path = require('path');
const queue = require('d3-queue').queue;

function filepaths(dir) {
  return fs
    .readdirSync(dir)
    .filter((d) => {
      return !d.match(/^\./);
    })
    .map((d) => {
      return path.join(dir, d);
    });
}

function loadFile(file, callback) {
  fs.readFile(file, (err, res) => {
    return callback(err, {
      svg: res,
      id: path.basename(file).replace('.svg', '')
    });
  });
}

const q = queue(16);

filepaths(path.resolve(__dirname, 'fixture', 'svg')).forEach((file) => {
  q.defer(loadFile, file);
});

q.awaitAll((err, buffers) => {
  [spritezero.generateLayout, spritezero.generateLayoutUnique].forEach(
    (fn, unique) => {
      [1, 2, 4].forEach((ratio) => {
        fn(
          { imgs: buffers, pixelRatio: ratio, format: true },
          (err, formattedLayout) => {
            if (err) {throw err;}
            fs.writeFile(
              path.resolve(
                __dirname,
                'fixture',
                `sprite${unique ? '-uniq' : ''}@${ratio}.json`
              ),
              JSON.stringify(formattedLayout, null, 2),
              'utf8',
              (err) => {
                if (err) {throw err;}
              }
            );
          }
        );
        fn({ imgs: buffers, pixelRatio: ratio }, (err, layout) => {
          if (err) {throw err;}
          spritezero.generateImage(layout, (err, image) => {
            if (err) {throw err;}
            fs.writeFile(
              path.resolve(
                __dirname,
                'fixture',
                `sprite${unique ? '-uniq' : ''}@${ratio}.png`
              ),

              image,
              (err) => {
                if (err) {throw err;}
              }
            );
          });
        });
      });
    }
  );
});
