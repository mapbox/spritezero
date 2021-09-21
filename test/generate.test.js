const fs = require('fs');
const glob = require('glob');
const path = require('path');
const queue = require('d3-queue').queue;
const spritezero = require('../');
const mapnik = require('mapnik');
const { toMatchImageSnapshot } = require('jest-image-snapshot');

const emptyPNG = new mapnik.Image(1, 1).encodeSync('png');

expect.extend({ toMatchImageSnapshot });

const fixtures = glob
  .sync(path.resolve(path.join(__dirname, '/fixture/svg/*.svg')))
  .map((im) => {
    return {
      svg: fs.readFileSync(im),
      id: path.basename(im).replace('.svg', '')
    };
  })
  .sort(() => {
    return Math.random() - 0.5;
  });

beforeAll(() => {
  jest.useFakeTimers();
});

test('generateLayout', () => {
  spritezero.generateLayout(
    { imgs: fixtures, pixelRatio: 1, format: false },
    (err, layout) => {
      expect(err).toBeFalsy();
      expect(layout.items.length).toBe(362);
      expect(layout.items[0].x).toBe(0);
      expect(layout.items[0].y).toBe(0);
    }
  );
});

test('generateLayout with icon size filter', () => {
  spritezero.generateLayout(
    {
      imgs: fixtures,
      pixelRatio: 1,
      format: false,
      removeOversizedIcons: true,
      maxIconSize: 15
    },
    (err, layout) => {
      expect(err).toBeFalsy();
      expect(layout.items.length).toBe(119);
      expect(layout.items[0].x).toBe(0);
      expect(layout.items[0].y).toBe(0);
    }
  );
});

test('generateLayout bench (concurrency=1,x10)', () => {
  const start = +new Date();
  const q = queue(1);
  for (let i = 0; i < 10; i++) {
    q.defer(spritezero.generateLayout, {
      imgs: fixtures,
      pixelRatio: 1,
      format: false
    });
  }
  q.awaitAll((err) => {
    expect(err).toBeFalsy();
    expect(true, `${new Date() - start}ms`).toBeTruthy();
  });
});

test('generateLayout bench (concurrency=4,x20)', () => {
  const start = +new Date();
  const q = queue(4);
  for (let i = 0; i < 20; i++) {
    q.defer(spritezero.generateLayout, {
      imgs: fixtures,
      pixelRatio: 1,
      format: false
    });
  }
  q.awaitAll((err) => {
    expect(err).toBeFalsy();
    expect(true, `${new Date() - start}ms`).toBeTruthy();
  });
});

test('generateLayoutUnique bench (concurrency=1,x10)', () => {
  const start = +new Date();
  const q = queue(1);
  for (let i = 0; i < 10; i++) {
    q.defer(spritezero.generateLayoutUnique, {
      imgs: fixtures,
      pixelRatio: 1,
      format: false
    });
  }
  q.awaitAll((err) => {
    expect(err).toBeFalsy();
    expect(true, `${new Date() - start}ms`).toBeTruthy();
  });
});

test('generateLayoutUnique bench (concurrency=4,x20)', () => {
  const start = +new Date();
  const q = queue(4);
  for (let i = 0; i < 20; i++) {
    q.defer(spritezero.generateLayoutUnique, {
      imgs: fixtures,
      pixelRatio: 1,
      format: false
    });
  }
  q.awaitAll((err) => {
    expect(err).toBeFalsy();
    expect(true, `${new Date() - start}ms`).toBeTruthy();
  });
});

test('generateLayoutUnique - not formatted', () => {
  spritezero.generateLayoutUnique(
    { imgs: fixtures, pixelRatio: 1, format: false },
    (err, layout) => {
      expect(err).toBeFalsy();
      // unique-24.svg and unique-24-copy.svg are unique
      expect(layout.items.length).toBe(361);
      expect(layout.items[0].x).toBe(0);
      expect(layout.items[0].y).toBe(0);
    }
  );
});

test('generateLayout', () => {
  spritezero.generateLayout(
    { imgs: fixtures, pixelRatio: 1, format: true },
    (err, formatted) => {
      expect(err).toBeFalsy();
      expect(Object.keys(formatted).length).toBe(362);
      // unique-24.svg and unique-24-copy.svg are NOT deduped
      // so the json references different x/y
      expect(formatted['unique-24']).not.toStrictEqual(
        formatted['unique-24-copy']
      );
    }
  );
});

test('generateLayoutUnique', () => {
  spritezero.generateLayoutUnique(
    { imgs: fixtures, pixelRatio: 1, format: true },
    (err, formatted) => {
      expect(err).toBeFalsy();
      // unique-24.svg and unique-24-copy.svg are deduped into a single one
      // but the json still references both, so still 362
      expect(Object.keys(formatted).length).toBe(362);
      // should be same x/y
      expect(formatted['unique-24']).toStrictEqual(formatted['unique-24-copy']);
    }
  );
});

test.each([1, 2, 4])('generateImage - sprite@%i', (scale, done) => {
  spritezero.generateLayout(
    { imgs: fixtures, pixelRatio: scale, format: true },
    (err, formatted) => {
      expect(err).toBeFalsy();
      spritezero.generateLayout(
        { imgs: fixtures, pixelRatio: scale, format: false },
        (err, layout) => {
          expect(err).toBeFalsy();
          expect(formatted).toMatchSnapshot();
          spritezero.generateImage(layout, (err, res) => {
            expect(err).toBeNull();
            expect(res).toMatchImageSnapshot();
            done();
          });
        }
      );
    }
  );
});

test.each([1, 2, 4])(
  'generateImage - unique - sprite-uniq@%i',
  (scale, done) => {
    spritezero.generateLayoutUnique(
      { imgs: fixtures, pixelRatio: scale, format: true },
      (err, formatted) => {
        expect(err).toBeFalsy();
        spritezero.generateLayoutUnique(
          { imgs: fixtures, pixelRatio: scale, format: false },
          (err, layout) => {
            expect(err).toBeFalsy();
            expect(formatted).toMatchSnapshot();
            spritezero.generateImage(layout, (err, res) => {
              expect(err).toBeFalsy();
              expect(res).toMatchImageSnapshot();
              done();
            });
          }
        );
      }
    );
  }
);

// Generating both a valid layout and image in one pass
test.each([1, 2, 4])(
  'generateOptimizeImage with format:true - sprite@%i',
  (scale, done) => {
    spritezero.generateLayout(
      { imgs: fixtures, pixelRatio: scale, format: true },
      (err, dataLayout, imageLayout) => {
        expect(err).toBeFalsy();
        expect(dataLayout).toMatchSnapshot();
        expect(imageLayout).toBeDefined();
        spritezero.generateOptimizedImage(
          imageLayout,
          { quality: 64 },
          (err, res) => {
            expect(err).toBeFalsy();
            expect(res).toMatchImageSnapshot();
            done();
          }
        );
      }
    );
  }
);

test.each([1, 2, 4])(
  'generateOptimizeImage with format:true - unique - sprite@%i',
  (scale, done) => {
    spritezero.generateLayoutUnique(
      { imgs: fixtures, pixelRatio: scale, format: true },
      (err, dataLayout, imageLayout) => {
        expect(err).toBeFalsy();
        expect(dataLayout).toMatchSnapshot();
        expect(imageLayout).toBeDefined();
        spritezero.generateOptimizedImage(
          imageLayout,
          { quality: 64 },
          (err, res) => {
            expect(err).toBeFalsy();
            expect(res).toMatchImageSnapshot();
            done();
          }
        );
      }
    );
  }
);

test('generateLayout with empty input', () => {
  spritezero.generateLayout(
    { imgs: [], pixelRatio: 1, format: true },
    (err, layout) => {
      expect(err).toBeFalsy();
      expect(layout).toStrictEqual({});
    }
  );
});

test('generateLayoutUnique with empty input', () => {
  spritezero.generateLayoutUnique(
    { imgs: [], pixelRatio: 1, format: true },
    (err, layout) => {
      expect(err).toBeFalsy();
      expect(layout).toStrictEqual({});
    }
  );
});

test('generateImage with empty input', () => {
  spritezero.generateLayout(
    { imgs: [], pixelRatio: 1, format: false },
    (err, layout) => {
      expect(err).toBeFalsy();
      spritezero.generateImage(layout, (err, sprite) => {
        expect(err).toBeFalsy();
        expect(sprite).toBeDefined();
        expect(sprite).toEqual(expect.any(Object));
      });
    }
  );
});

test('generateImage unique with empty input', () => {
  spritezero.generateLayoutUnique(
    { imgs: [], pixelRatio: 1, format: false },
    (err, layout) => {
      expect(err).toBeFalsy();
      spritezero.generateImage(layout, (err, sprite) => {
        expect(err).toBeFalsy();
        expect(sprite).toBeDefined();
        expect(sprite).toEqual(expect.any(Object));
      });
    }
  );
});

test('generateImage unique with max_size', () => {
  spritezero.generateLayoutUnique(
    { imgs: fixtures, pixelRatio: 1, format: false, maxIconSize: 10 },
    (err, layout) => {
      expect(err).toBeDefined();
      expect(layout).toBeUndefined();
      expect(err.message).toBe(
        'image created from svg must be 10 pixels or fewer on each side'
      );
    }
  );
});

test('generateLayout relative width/height SVG returns empty', () => {
  const fixtures = [
    {
      id: 'relative-dimensions',
      svg: fs.readFileSync('./test/fixture/relative-dimensions.svg')
    },
    {
      id: 'art',
      svg: fs.readFileSync('./test/fixture/svg/art-gallery-18.svg')
    }
  ];

  spritezero.generateLayout(
    { imgs: fixtures, pixelRatio: 1, format: true },
    (err, formatted) => {
      expect(err).toBeFalsy();
      expect(formatted).toStrictEqual({
        art: { width: 18, height: 18, x: 0, y: 0, pixelRatio: 1 }
      });
    }
  );
});

test('generateLayout only relative width/height SVG returns empty sprite object', () => {
  const fixtures = [
    {
      id: 'relative-dimensions',
      svg: fs.readFileSync('./test/fixture/relative-dimensions.svg')
    }
  ];

  spritezero.generateLayout(
    { imgs: fixtures, pixelRatio: 1, format: false },
    (err, layout) => {
      expect(err).toBeFalsy();
      expect(layout).toStrictEqual({ width: 0, height: 0, items: [] });

      spritezero.generateImage(layout, (err, image) => {
        expect(err).toBeFalsy();
        expect(image).toStrictEqual(emptyPNG);
      });
    }
  );
});

test('generateLayout containing image with no width or height SVG', () => {
  const fixtures = [
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
  spritezero.generateLayout(
    { imgs: fixtures, pixelRatio: 1, format: true },
    (err, formatted) => {
      expect(err).toBeFalsy();
      expect(formatted).toStrictEqual({
        art: { width: 18, height: 18, x: 0, y: 0, pixelRatio: 1 }
      });
    }
  );
});

test('generateLayout containing only image with no width or height', () => {
  const fixtures = [
    {
      id: 'no-width-or-height',
      svg: fs.readFileSync('./test/fixture/no-width-or-height.svg')
    }
  ];

  spritezero.generateLayout(
    { imgs: fixtures, pixelRatio: 1, format: false },
    (err, layout) => {
      expect(err).toBeFalsy();
      expect(layout, 'empty layout').toStrictEqual({
        width: 0,
        height: 0,
        items: []
      });

      spritezero.generateImage(layout, (err, image) => {
        expect(err).toBeFalsy();
        expect(image).toStrictEqual(emptyPNG);
      });
    }
  );
});

test('generateLayout with extractMetadata option set to false', () => {
  const fixtures = [
    {
      id: 'cn',
      svg: fs.readFileSync(
        './test/fixture/svg-metadata/cn-nths-expy-2-affinity.svg'
      )
    }
  ];

  spritezero.generateLayout(
    { imgs: fixtures, pixelRatio: 1, format: true, extractMetadata: false },
    (err, formatted) => {
      expect(err).toBeFalsy();
      expect(formatted).toStrictEqual({
        cn: { width: 20, height: 23, x: 0, y: 0, pixelRatio: 1 }
      });
    }
  );
});

test('generateLayout without extractMetadata option set (defaults to true)', () => {
  const fixtures = [
    {
      id: 'cn',
      svg: fs.readFileSync(
        './test/fixture/svg-metadata/cn-nths-expy-2-affinity.svg'
      )
    }
  ];

  spritezero.generateLayout(
    { imgs: fixtures, pixelRatio: 1, format: true },
    (err, formatted) => {
      expect(err).toBeFalsy();
      expect(formatted).deepEqual({
        cn: {
          width: 20,
          height: 23,
          x: 0,
          y: 0,
          pixelRatio: 1,
          content: [2, 5, 18, 18],
          stretchX: [[4, 16]],
          stretchY: [[5, 16]]
        }
      });
    }
  );
});

test('generateLayout without extractMetadata option set (defaults to true) when generating an image layout (format set to false)', () => {
  const fixtures = [
    {
      id: 'cn',
      svg: fs.readFileSync(
        './test/fixture/svg-metadata/cn-nths-expy-2-affinity.svg'
      )
    }
  ];

  spritezero.generateLayout(
    { imgs: fixtures, pixelRatio: 1, format: false },
    (err, formatted) => {
      expect(err).toBeFalsy();
      expect(formatted.items[0].stretchX).toBeUndefined();
    }
  );
});

test('generateLayout with both placeholder and stretch zone', () => {
  const fixtures = [
    {
      id: 'au-national-route-5',
      svg: fs.readFileSync(
        './test/fixture/svg-metadata/au-national-route-5.svg'
      )
    }
  ];
  spritezero.generateLayout(
    { imgs: fixtures, pixelRatio: 1, format: true },
    (err, formatted) => {
      expect(err).toBeFalsy();
      expect(formatted).toStrictEqual({
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
      });
    }
  );
});

test('generateLayoutUnique relative width/height SVG returns empty', () => {
  const fixtures = [
    {
      id: 'relative-dimensions',
      svg: fs.readFileSync('./test/fixture/relative-dimensions.svg')
    },
    {
      id: 'art',
      svg: fs.readFileSync('./test/fixture/svg/art-gallery-18.svg')
    }
  ];

  spritezero.generateLayoutUnique(
    { imgs: fixtures, pixelRatio: 1, format: true },
    (err, formatted) => {
      expect(err).toBeFalsy();
      expect(formatted).toStrictEqual({
        art: { width: 18, height: 18, x: 0, y: 0, pixelRatio: 1 }
      });
    }
  );
});

test('generateLayoutUnique only relative width/height SVG returns empty sprite object', () => {
  const fixtures = [
    {
      id: 'relative-dimensions',
      svg: fs.readFileSync('./test/fixture/relative-dimensions.svg')
    }
  ];

  spritezero.generateLayoutUnique(
    { imgs: fixtures, pixelRatio: 1, format: false },
    (err, layout) => {
      expect(err).toBeFalsy();
      expect(layout).toStrictEqual({ width: 0, height: 0, items: [] });

      spritezero.generateImage(layout, (err, image) => {
        expect(err).toBeFalsy();
        expect(image).toStrictEqual(emptyPNG);
      });
    }
  );
});

test('generateLayoutUnique containing image with no width or height SVG', () => {
  const fixtures = [
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
  spritezero.generateLayoutUnique(
    { imgs: fixtures, pixelRatio: 1, format: true },
    (err, formatted) => {
      expect(err).toBeFalsy();
      expect(formatted).toStrictEqual({
        art: { width: 18, height: 18, x: 0, y: 0, pixelRatio: 1 }
      });
    }
  );
});

test('generateLayoutUnique containing only image with no width or height', () => {
  const fixtures = [
    {
      id: 'no-width-or-height',
      svg: fs.readFileSync('./test/fixture/no-width-or-height.svg')
    }
  ];

  spritezero.generateLayoutUnique(
    { imgs: fixtures, pixelRatio: 1, format: false },
    (err, layout) => {
      expect(err).toBeFalsy();
      expect(layout, 'empty layout').toStrictEqual({
        width: 0,
        height: 0,
        items: []
      });

      spritezero.generateImage(layout, (err, image) => {
        expect(err).toBeFalsy();
        expect(image).toStrictEqual(emptyPNG);
      });
    }
  );
});

test('generateLayoutUnique with extractMetadata option set to false', () => {
  const fixtures = [
    {
      id: 'cn',
      svg: fs.readFileSync(
        './test/fixture/svg-metadata/cn-nths-expy-2-affinity.svg'
      )
    }
  ];

  spritezero.generateLayoutUnique(
    { imgs: fixtures, pixelRatio: 1, format: true, extractMetadata: false },
    (err, formatted) => {
      expect(err).toBeFalsy();
      expect(formatted).toStrictEqual({
        cn: { width: 20, height: 23, x: 0, y: 0, pixelRatio: 1 }
      });
    }
  );
});

test('generateLayoutUnique without extractMetadata option set (defaults to true)', () => {
  const fixtures = [
    {
      id: 'cn',
      svg: fs.readFileSync(
        './test/fixture/svg-metadata/cn-nths-expy-2-affinity.svg'
      )
    }
  ];

  spritezero.generateLayoutUnique(
    { imgs: fixtures, pixelRatio: 1, format: true },
    (err, formatted) => {
      expect(err).toBeFalsy();
      expect(formatted).deepEqual({
        cn: {
          width: 20,
          height: 23,
          x: 0,
          y: 0,
          pixelRatio: 1,
          content: [2, 5, 18, 18],
          stretchX: [[4, 16]],
          stretchY: [[5, 16]]
        }
      });
    }
  );
});

test('generateLayoutUnique without extractMetadata option set (defaults to true) when generating an image layout (format set to false)', () => {
  const fixtures = [
    {
      id: 'cn',
      svg: fs.readFileSync(
        './test/fixture/svg-metadata/cn-nths-expy-2-affinity.svg'
      )
    }
  ];

  spritezero.generateLayoutUnique(
    { imgs: fixtures, pixelRatio: 1, format: false },
    (err, formatted) => {
      expect(err).toBeFalsy();
      expect(formatted.items[0].stretchX).toBeUndefined();
    }
  );
});

test('generateLayoutUnique with both placeholder and stretch zone', () => {
  const fixtures = [
    {
      id: 'au-national-route-5',
      svg: fs.readFileSync(
        './test/fixture/svg-metadata/au-national-route-5.svg'
      )
    }
  ];
  spritezero.generateLayoutUnique(
    { imgs: fixtures, pixelRatio: 1, format: true },
    (err, formatted) => {
      expect(err).toBeFalsy();
      expect(formatted).toStrictEqual({
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
      });
    }
  );
});

test('generateLayout - mapnik', () => {
  spritezero.generateLayout(
    { imgs: fixtures, pixelRatio: 1, format: false },
    (err, layout) => {
      expect(err).toBeFalsy();
      expect(layout.items.length).toBe(362);
      expect(layout.items[0].x).toBe(0);
      expect(layout.items[0].y).toBe(0);
    }
  );
});
