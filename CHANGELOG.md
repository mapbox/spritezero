:warning: = breaking change

## 3.7.0
##### 2016-08-10
* Update to shelf-pack v2
* ShelfPack now trims sprite to minimum dimensions after a batch pack
* Make sure heightAscThanNameComparator is transitive (#29)

## 3.6.0
##### 2016-06-05
* Perf improvement, replace sort-by with custom comparator (#27)
* Add `generateLayoutUnique` function - map identical images to multiple names (#25)

## 3.5.0
##### 2016-03-30
* Use shelf-pack binpacker (#22)

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
