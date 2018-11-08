[![npm version](https://badge.fury.io/js/%40mapbox%2Fspritezero.svg)](https://badge.fury.io/js/%40mapbox%2Fspritezero)
[![build status](https://secure.travis-ci.org/mapbox/spritezero.svg)](http://travis-ci.org/mapbox/spritezero)

## spritezero

Small opinionated sprites.

Why is this different than sprite generation libraries like [spritesmith](https://github.com/Ensighten/spritesmith)?
spritezero was initially created to power a sprite API, and thus is geared towards
_performance_, as well as an ability to work with image data in _buffers_
rather than on disk. Also, since version 2.0, spritezero generates sprites
based on SVG graphics alone, therefore making it possible to support @2x
and higher-dpi sprites from the same source.


### Usage
```js
var spritezero = require('@mapbox/spritezero');
var fs = require('fs');
var glob = require('glob');
var path = require('path');

[1, 2, 4].forEach(function(pxRatio) {
    var svgs = glob.sync(path.resolve(path.join(__dirname, 'input/*.svg')))
        .map(function(f) {
            return {
                svg: fs.readFileSync(f),
                id: path.basename(f).replace('.svg', '')
            };
        });
    var pngPath = path.resolve(path.join(__dirname, 'output/sprite@' + pxRatio + '.png'));
    var jsonPath = path.resolve(path.join(__dirname, 'output/sprite@' + pxRatio + '.json'));

    // Pass `true` in the layout parameter to generate a data layout
    // suitable for exporting to a JSON sprite manifest file.
    spritezero.generateLayout({ imgs: svgs, pixelRatio: pxRatio, format: true }, function(err, dataLayout) {
        if (err) return;
        fs.writeFileSync(jsonPath, JSON.stringify(dataLayout));
    });

    // Pass `false` in the layout parameter to generate an image layout
    // suitable for exporting to a PNG sprite image file.
    spritezero.generateLayout({ imgs: svgs, pixelRatio: pxRatio, format: false }, function(err, imageLayout) {
        spritezero.generateImage(imageLayout, function(err, image) {
            if (err) return;
            fs.writeFileSync(pngPath, image);
        });
    });

});

```


### Documentation

Complete API documentation is here:  http://mapbox.github.io/spritezero/


### Installation

Requires [nodejs](http://nodejs.org/) v4.0.0 or greater.

```bash
$ npm install @mapbox/spritezero
```


### Executable

[spritezero-cli](https://github.com/mapbox/spritezero-cli) is an executable for bundling and creating your own sprites from a folder of svg's:

```bash
$ npm install -g @mapbox/spritezero-cli
$ spritezero --help

Usage:
spritezero [output filename] [input directory]
  --retina      shorthand for --ratio=2
  --ratio=[n]   pixel ratio
```
