# spritezero

small opinionated sprites


### `decodeImage`

Decode a single image, returning a node-canvas Image object
and exposing its width and height programmatically.


### `generateLayout(imgs)`

Pack a list of images with width and height into a sprite layout.
Uses bin-pack.

### Parameters

| parameter | type              | description                                                            |
| --------- | ----------------- | ---------------------------------------------------------------------- |
| `imgs`    | Array\.\<Object\> | array of { buffer: ..., id: ..., pixels: ..., width: ... height: ... } |



### `generateImage(imgs, callback)`

Generate a PNG image with positioned icons on a sprite.

### Parameters

| parameter  | type              | description                                                                          |
| ---------- | ----------------- | ------------------------------------------------------------------------------------ |
| `imgs`     | Array\.\<Object\> | array of { buffer: ..., id: ..., pixels: ..., width: ... height: ... x: ... y: ... } |
| `callback` | Function          |                                                                                      |



### `formatLayout(packing)`

format layout for output: make it json serializable and all that.


### Parameters

| parameter | type   | description                  |
| --------- | ------ | ---------------------------- |
| `packing` | Object | the output of generateLayout |



**Returns** `Object`, serializable sprite metadata

## Installation

Requires [nodejs](http://nodejs.org/).

```sh
$ npm install spritezero
```

## Tests

```sh
$ npm test
```


