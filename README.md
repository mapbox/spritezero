# spritezero

[![build status](https://secure.travis-ci.org/mapbox/spritezero.png)](http://travis-ci.org/mapbox/spritezero)

small opinionated sprites


### `generateLayout(imgs, format)`

Pack a list of images with width and height into a sprite layout.
Uses bin-pack.

### Parameters

| parameter | type              | description                                                   |
| --------- | ----------------- | ------------------------------------------------------------- |
| `imgs`    | Array\.\<Object\> | array of `{ buffer: Buffer, id: String, pixelRatio: Number }` |
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


