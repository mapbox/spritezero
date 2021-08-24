## 8.0.0
#### 2021-08-23
* Changes the `stretchMetadata` option to `extractMetadata`.
* Extends the `extractMetadata` function to support placeholder text elements.

## 7.0.1
* `generateLayout({format:true})` now returns a second argument, which is a layout object that can be sent to generateImage to generate a final image. Normally users would generate this object with `generateLayout({format:false})` but now `generateLayout({format:true})` will provide both the data layout (as first arg) and the image layout (as the second arg).
* Added new function `generateOptimizedImage` which, compared to `generateImage`, expects an options argument as the second option and returns a paletted PNG. Currently this options argument accepts a `quality` property to control the quantization level of the resulting PNG.


## 7.0.0
#### 2020-04-22
* Optimized layout and image generation: 1.5x faster `generateLayout`

## 6.3.0
#### 2020-04-10
* Adds `stretchMetadata` option (defaults to true) to `generateLayout` and `generateLayoutUnique` [#75](https://github.com/mapbox/spritezero/pull/75)
* Removes xtend as a direct dependency

## 6.2.0
#### 2020-03-09
* Add methods to parse and validate metadata for stretchable icons from SVGs: `extractMetadata` and `validateMetadata`
* Drop support for Node < 10
* Updates Mapnik dependency to 4.4.0

## 6.1.2
##### 2019-11-11
* Check if SVG has width/height attributes before encoding as image in `generateLayout` [#69](https://github.com/mapbox/spritezero/pull/69)

## 6.1.1
##### 2019-05-20
* Check if SVG width/height are greater than zero before encoding as image in `generateLayout` [#62](https://github.com/mapbox/spritezero/pull/62)

## 6.1.0
##### 2018-06-28
* Updates to Mapnik dependency to 4.0.0

:warning: = breaking change
## 6.0.0
##### 2018-02-22
* Updates Mapnik dependency to 3.7.0
* Drops support for windows

## 5.1.0
##### 2017-05-25
* Added removeOversizedIcons boolean to the options args - if set to true, will filter out oversized icons from the response

## 5.0.0
##### 2017-04-19
* :warning: change `generateLayout` and `generateLayoutUnique` to accept options arguments and add functionality to pass optional max_size argument

## 4.1.0
##### 2017-04-19
* Updates Mapnik dependency to 3.6.0

## 4.0.1
##### 2017-02-13
* Bump ShelfPack dependency to 3.0.0

## 4.0.0
##### 2017-02-12
* :warning: spritezero now a scoped package under @mapbox namespace (#40)

## 3.8.0
##### 2016-09-15
* Update to mapnik 3.5.14 (#26)

## 3.7.1
##### 2016-09-14
* Pin mapnik dependency at version 3.5.13 (#33)

## 3.7.0
##### 2016-08-10
* Bump ShelfPack dependency to 2.0.0
* ShelfPack now trims sprite to minimum dimensions after a batch pack
* Make sure heightAscThanNameComparator is transitive (#29)

## 3.6.0
##### 2016-06-05
* Perf improvement, replace sort-by with custom comparator (#27)
* Add `generateLayoutUnique` function - map identical images to multiple names (#25)

## 3.5.0
##### 2016-03-30
* Use ShelfPack binpacker (#22)

## 3.4.0
##### 2016-03-08
* Sort icons array to produce a more deterministic sprite sheet (#24)

## 3.3.0
##### 2016-02-27
* Updated to mapnik 3.5.0

## 3.2.2
##### 2016-02-03
* Add missing var (#20)

## 3.2.1
##### 2016-01-19
* Remove `bin` in `package.json`

## 3.2.0
##### 2016-01-19
* :warning: Remove cli, point to spritezero-cli (#19)

## 3.1.0
##### 2016-01-13
* Add executeable and documentation

## 3.0.2
##### 2016-01-09
* Update dependencies
* Update fixtures and tests

## 3.0.1
##### 2015-10-10
* Update dependencies

## 3.0.0
##### 2015-09-03
* :warning: Changes the `generateLayout` function to be asynchronous (#14)

## 2.1.0
##### 2015-08-13
* No longer throws an error if `generateImage()` is supplied with empty list (#13)

## 2.0.0
##### 2015-08-05
* :warning: In the second major version, spritezero makes a big pivot: instead of
positioning and compositing raster sprites, it receives and composites vector
sprites composed of SVG data.
