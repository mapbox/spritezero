# spritezero

[![npm version](https://badge.fury.io/js/spritezero.svg)](https://badge.fury.io/js/spritezero)
[![build status](https://secure.travis-ci.org/mapbox/spritezero.svg)](http://travis-ci.org/mapbox/spritezero)

Small opinionated sprites.

Why is this different than sprite generation libraries like [spritesmith](https://github.com/Ensighten/spritesmith)?
spritezero was initially created to power a sprite API, and thus is geared towards
_performance_, as well as an ability to work with image data in _buffers_
rather than on disk. Also, since version 2.0, spritezero generates sprites
based on SVG graphics alone, therefore making it possible to support @2x
and higher-dpi sprites from the same source.


## API

###`generateLayout(imgs, ratio, format, callback)`

Pack a list of images with width and height into a sprite layout.
Uses [shelf-pack](https://github.com/mapbox/shelf-pack).

**Parameters**

| parameter  | type              | description                            |
| ---------- | ----------------- | -------------------------------------- |
| `imgs`     | Array\.\<Object\> | array of `{ svg: Buffer, id: String }` |
| `scale`    | number            | pixel scale. default is 1, retina is 2 |
| `format`   | boolean           | format this layout for Mapbox GL       |
| `callback` | function          | accepts two arguments, `err` and `layout` Object |

**Returns** results of `callback`

---

###`generateLayoutUnique(imgs, ratio, format, callback)`

Identical to `generateLayout(imgs, ratio, format, callback)` but maps identical images to a single
image while preserving the reference in the Mapbox GL layout.

---

###`generateImage(packing, callback)`

Generate a PNG image with positioned icons on a sprite.

**Parameters**

| parameter  | type     | description |
| ---------- | -------- | ----------- |
| `packing`  | Object   |             |
| `callback` | Function |             |


## Installation

Requires [nodejs](http://nodejs.org/).

```sh
$ npm install spritezero
```

## Executable

[spritezero-cli](https://github.com/mapbox/spritezero-cli) is an executable for bundling and creating your own sprites from a folder of svg's:

```bash
$ npm install -g spritezero-cli
$ spritezero --help

Usage:
spritezero [output filename] [input directory]
  --retina      shorthand for --ratio=2
  --ratio=[n]   pixel ratio
```

## Tests

```sh
$ npm test
```
