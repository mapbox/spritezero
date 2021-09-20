const fs = require('fs');

const extractMetadata = require('../lib/extract-svg-metadata');
const validateMetadata = require('../lib/validate-svg-metadata');

test('image without metadata', () => {
  extractMetadata(
    {
      svg: fs.readFileSync(
        `${__dirname}/fixture/svg/aerialway-24.svg`,
        'utf-8'
      )
    },
    (err, metadata) => {
      expect(err).toBeNull();
      expect(metadata, 'does not have metadata').toStrictEqual({});
    }
  );
});

test('image with nested metadata', () => {
  extractMetadata(
    {
      svg: fs.readFileSync(
        `${__dirname}/fixture/svg-metadata/cn-nths-expy-2-affinity.svg`,
        'utf-8'
      )
    },
    (err, metadata) => {
      expect(err).toBeNull();
      expect(metadata).toBeDefined();
      expect(metadata).toStrictEqual({
        stretchX: [[4, 16]],
        stretchY: [[5, 16]],
        content: [2, 5, 18, 18]
      });
    }
  );
});

test('image exported by Illustrator', () => {
  extractMetadata(
    {
      svg: fs.readFileSync(
        `${__dirname}/fixture/svg-metadata/shield-illustrator.svg`
      )
    },
    (err, metadata) => {
      expect(err).toBeNull();
      expect(metadata).toBeDefined();
      expect(metadata).toStrictEqual({
        content: [4, 8, 14, 14],
        stretchY: [[8, 14]],
        stretchX: [[4, 14]]
      });
    }
  );
});

test('image exported by Illustrator, rotated', () => {
  extractMetadata(
    {
      svg: fs.readFileSync(
        `${__dirname}/fixture/svg-metadata/shield-illustrator-rotated.svg`
      )
    },
    (err, metadata) => {
      expect(err).toBeNull();
      expect(metadata).toBeDefined();
      expect(metadata).toStrictEqual({
        content: [3.703, 5.806, 12.189, 14.291],
        stretchY: [[10.58, 14.257]],
        stretchX: [[3.73, 9.528]]
      });
    }
  );
});

test('image exported by Illustrator, rotated + translated', () => {
  extractMetadata(
    {
      svg: fs.readFileSync(
        `${__dirname}/fixture/svg-metadata/shield-illustrator-rotated-translated.svg`
      )
    },
    (err, metadata) => {
      expect(err).toBeNull();
      expect(metadata).toBeDefined();
      expect(metadata).toStrictEqual({
        content: [4.242, 7.07, 11.313, 14.142],
        stretchY: [[10.606, 14.142]],
        stretchX: [[4.242, 9.192]]
      });
    }
  );
});

test('image exported by Illustrator, rotated + reversed', () => {
  extractMetadata(
    {
      svg: fs.readFileSync(
        `${__dirname}/fixture/svg-metadata/shield-illustrator-rotated-reversed.svg`
      )
    },
    (err, metadata) => {
      expect(err).toBeNull();
      expect(metadata).toBeDefined();
      expect(metadata).toStrictEqual({
        content: [6, 8, 12, 12],
        stretchY: [[8, 12]],
        stretchX: [[6, 12]]
      });
    }
  );
});

test('image with one stretch rect', () => {
  extractMetadata(
    {
      svg: fs.readFileSync(
        `${__dirname}/fixture/svg-metadata/cn-nths-expy-2-inkscape-plain.svg`
      )
    },
    (err, metadata) => {
      expect(err).toBeNull();
      expect(metadata).toBeDefined();
      expect(metadata).toStrictEqual({
        stretchX: [[3, 17]],
        stretchY: [[5, 17]]
      });
    }
  );
});

test('image with multiple stretch zones', () => {
  extractMetadata(
    {
      svg: fs.readFileSync(
        `${__dirname}/fixture/svg-metadata/ae-national-3-affinity.svg`
      )
    },
    (err, metadata) => {
      expect(err).toBeNull();
      expect(metadata).toBeDefined();
      expect(metadata).toStrictEqual({
        stretchX: [
          [5, 7],
          [20, 22]
        ],
        content: [3, 7, 23, 18]
      });
    }
  );
});

test('image with multiple stretch zones and higher pixelRatio', () => {
  extractMetadata(
    {
      pixelRatio: 2,
      svg: fs.readFileSync(
        `${__dirname}/fixture/svg-metadata/ae-national-3-affinity.svg`
      )
    },
    (err, metadata) => {
      expect(err).toBeNull();
      expect(metadata).toBeDefined();
      expect(metadata).toStrictEqual({
        stretchX: [
          [10, 14],
          [40, 44]
        ],
        content: [6, 14, 46, 36]
      });
    }
  );
});

test('invalid svg', () => {
  extractMetadata({ svg: '<svg>' }, (err) => {
    expect(err).toBeDefined();
    expect(err.message).toMatch(/Unclosed root tag/);
  });
});

describe('invalid images', () => {
  test('content area without height', () => {
    extractMetadata(
      {
        svg: '<svg><rect id="mapbox-icon-content" x="0" y="0" width="30"/></svg>'
      },
      (err, metadata) => {
        expect(err).toBeNull();
        expect(metadata).toStrictEqual({});
      }
    );
  });

  test('invalid mapbox-icon-* ID', () => {
    extractMetadata(
      {
        svg: '<svg><rect id="mapbox-icon-none" x="0" width="30" height="20"/></svg>'
      },
      (err, metadata) => {
        expect(err).toBeNull();
        expect(metadata).toStrictEqual({});
      }
    );
  });

  test('no path data', () => {
    extractMetadata(
      { svg: '<svg><path id="mapbox-icon-content"/></svg>' },
      (err, metadata) => {
        expect(err).toBeNull();
        expect(metadata).toStrictEqual({});
      }
    );
  });

  test('invalid path data', () => {
    extractMetadata(
      { svg: '<svg><path id="mapbox-icon-content" d="hello"/></svg>' },
      (err, metadata) => {
        expect(err).toBeNull();
        expect(metadata).toStrictEqual({});
      }
    );
  });
});

test.each([
  {},
  { content: [2, 2, 22, 16] },
  { content: [0, 0, 24, 18] },
  { stretchX: [] },
  { stretchX: [[10, 14]] },
  { stretchY: [[8, 10]] }
])('valid metadata', (metadata) => {
  const img = { width: 24, height: 18 };
  expect(validateMetadata(img, metadata)).toBeNull();
});

const validImg = { width: 24, height: 18 };
test.each([
  [undefined, undefined, 'image is invalid'],
  [{}, undefined, 'image has invalid metadata'],
  [{}, {}, 'image has invalid width'],
  [{ width: 0 }, {}, 'image has invalid width'],
  [{ width: -3 }, {}, 'image has invalid width'],
  [{ width: 32 }, {}, 'image has invalid height'],
  [{ width: 32, height: {} }, {}, 'image has invalid height'],
  [{ width: 32, height: -32 }, {}, 'image has invalid height'],
  [
    validImg,
    { content: {} },
    'image content area must be an array of 4 numbers'
  ],
  [
    validImg,
    { content: [] },
    'image content area must be an array of 4 numbers'
  ],
  [
    validImg,
    { content: [1, 2, 3] },
    'image content area must be an array of 4 numbers'
  ],
  [
    validImg,
    { content: [1, 2, 3, 4, 5] },
    'image content area must be an array of 4 numbers'
  ],
  [
    validImg,
    { content: [1, 2, 3, true] },
    'image content area must be an array of 4 numbers'
  ],
  [validImg, { content: [4, 4, 4, 4] }, 'image content area must be positive'],
  [validImg, { content: [4, 4, 2, 2] }, 'image content area must be positive'],
  [
    validImg,
    { content: [0, 0, 25, 18] },
    'image content area must be within image bounds'
  ],
  [
    validImg,
    { content: [0, 0, 24, 19] },
    'image content area must be within image bounds'
  ],
  [
    validImg,
    { content: [-1, 0, 24, 18] },
    'image content area must be within image bounds'
  ],
  [
    validImg,
    { content: [0, -1, 24, 18] },
    'image content area must be within image bounds'
  ],
  [validImg, { stretchX: {} }, 'image stretchX zones must be an array'],
  [
    validImg,
    { stretchX: ['yes'] },
    'image stretchX zone must consist of two numbers'
  ],
  [
    validImg,
    { stretchX: [[]] },
    'image stretchX zone must consist of two numbers'
  ],
  [
    validImg,
    { stretchX: [[4, 4, 4]] },
    'image stretchX zone must consist of two numbers'
  ],
  [
    validImg,
    {
      stretchX: [
        [4, 5],
        [6, null]
      ]
    },
    'image stretchX zone must consist of two numbers'
  ],
  [
    validImg,
    { stretchX: [[4, 4]] },
    'image stretchX zone may not be zero-size'
  ],
  [
    validImg,
    { stretchX: [[8, 4]] },
    'image stretchX zone may not be zero-size'
  ],
  [
    validImg,
    { stretchX: [[-2, 2]] },
    'image stretchX zone must be within image bounds'
  ],
  [
    validImg,
    { stretchX: [[0, 25]] },
    'image stretchX zone must be within image bounds'
  ],
  [
    validImg,
    { stretchX: [[0, 24.999]] },
    'image stretchX zone must be within image bounds'
  ],
  [
    validImg,
    {
      stretchX: [
        [0, 2],
        [1, 3]
      ]
    },
    'image stretchX zones may not overlap'
  ],
  [
    validImg,
    {
      stretchX: [
        [0, 24],
        [8, 16]
      ]
    },
    'image stretchX zones may not overlap'
  ],
  [
    validImg,
    {
      stretchX: [
        [18, 24],
        [0, 6]
      ]
    },
    'image stretchX zones may not overlap'
  ]
])('invalid metadata - %#', (img, metadta, message) => {
  expect(validateMetadata(img, metadta).message, 'rejects missing object').toBe(
    message
  );
});
