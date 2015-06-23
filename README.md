# spritezero

[![build status](https://secure.travis-ci.org/mapbox/spritezero.png)](http://travis-ci.org/mapbox/spritezero)

Small opinionated sprites.

Why is this different than sprite generation libraries like [spritesmith](https://github.com/Ensighten/spritesmith)?
spritezero was initially created to power a sprite API, and thus is geared towards
_performance_, as well as an ability to work with image data in _buffers_
rather than on disk. Also, since version 2.0, spritezero generates sprites
based on SVG graphics alone, therefore making it possible to support @2x
and higher-dpi sprites from the same source.

### `generateLayout(imgs, format)`

Pack a list of images with width and height into a sprite layout.
Uses bin-pack.

### Parameters

| parameter | type              | description                                                   |
| --------- | ----------------- | ------------------------------------------------------------- |
| `imgs`    | Array\.\<Object\> | array of `{ svg: Buffer, id: String }` |
| `format`  | boolean           | format this layout for mapbox gl                              |



**Returns** `Object`, layout


### `generateImage(packing, callback)`

Generate a PNG image with positioned icons on a sprite.

### Parameters

| parameter  | type     | description |
| ---------- | -------- | ----------- |
| `packing`  | Object   |             |
| `callback` | Function |             |


## Installation

Requires [nodejs](http://nodejs.org/).

```sh
$ npm install spritezero
```

## Tests

```sh
$ npm test
```


