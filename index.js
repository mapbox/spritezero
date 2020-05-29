const generate = require('./lib/generate');

exports.generateLayout = generate.generateLayout;
exports.generateLayoutUnique = generate.generateLayoutUnique;
exports.generateImage = generate.generateImage;
exports.generateOptimizedImage = generate.generateOptimizedImage;
exports.extractMetadata = require('./lib/extract-svg-metadata');

exports.validateMetadata = require('./lib/validate-svg-metadata');
