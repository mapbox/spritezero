const { resolvePluginConfig } = require('svgo/lib/svgo/config');
const { parseSvg } = require('svgo/lib/parser');
const { stringifySvg } = require('svgo/lib/stringifier');
const { invokePlugins } = require('svgo/lib/svgo/plugins');
const computePathBounds = require('svg-boundings').path;

const metadataPrefix = 'mapbox-';

// Removes `style` attribute. Otherwise, transforms will not apply. 
// Refer to https://github.com/svg/svgo/blob/a9834efa1603198ae606765292215462ae193d0d/plugins/applyTransforms.js#L55-L57
const removeStyleAttribute = {
    name: 'removeStyleAttribute',
      type: 'perItem',
  fn: (item) => {
    if (item.hasAttr('style'))
        item.removeAttr('style');
    return item;
    }
};

// Transforms `id="mapbox-*"` into `mapbox:metadata="*"` so that the `convertPathData` step
// resolves transforms.
const renameMapboxMetadata = {
    name: 'renameMapboxMetadata',
    type: 'perItem',
    fn: function(item) {
        if (item.hasAttr('id')) {
            const id = item.attr('id');
            if (id.value.startsWith(metadataPrefix)) {
                let valueSubstr = id.value.substring(metadataPrefix.length);
                item.removeAttr('id');
                item.addAttr({
                    name: 'mapbox:metadata',
                    value: valueSubstr,
                    prefix: '',
                    local: 'mapbox:metadata',
                });
            }
        }

        return item;
    }
};

/**
 * Decrease accuracy of floating-point numbers
 * in path data keeping a specified number of decimals.
 * Smart rounds values like 2.3491 to 2.35 instead of 2.349.
 * Doesn't apply "smartness" if the number precision fits already.
 *
 * Taken from svgo at https://github.com/svg/svgo/blob/72db8eb/plugins/convertPathData.js#L773
 */
function strongRound(value, precision) {
    if (!precision) {
        precision = 3;
    }
    const error = +Math.pow(0.1, precision).toFixed(precision);
    if (+value.toFixed(precision) !== value) {
        var rounded = +value.toFixed(precision - 1);
        value = +Math.abs(rounded - value).toFixed(precision + 1) >= error ?
            +value.toFixed(precision) :
            rounded;
    }
    return value;
}

// Plugin for use with svgo that extracts metadata from paths.
const extractMapboxMetadata = {
    name: 'extractMapboxMetadata',
    type: 'perItem',
    fn: function (item, params, info) {
        if (item.isElem('path') && item.hasAttr('mapbox:metadata') && item.hasAttr('d')) {
            const metadata = item.attr('mapbox:metadata');
            const bounds = computePathBounds({ d: item.attr('d').value }, true);

            // Make sure that we actually have a valid bounding box.
            if (!Number.isFinite(bounds.left) || !Number.isFinite(bounds.right) ||
                !Number.isFinite(bounds.top) || !Number.isFinite(bounds.bottom)) {
                return true;
            }

            // Scale bounds by pixel ratio.
            bounds.left = strongRound(bounds.left * info.pixelRatio);
            bounds.top = strongRound(bounds.top * info.pixelRatio);
            bounds.right = strongRound(bounds.right * info.pixelRatio);
            bounds.bottom = strongRound(bounds.bottom * info.pixelRatio);

            if (metadata.value.startsWith('stretch-x')) {
                (info.metadata.stretchX = info.metadata.stretchX || []).push([bounds.left, bounds.right]);
            } else if (metadata.value.startsWith('stretch-y')) {
                (info.metadata.stretchY = info.metadata.stretchY || []).push([bounds.top, bounds.bottom]);
            } else if (metadata.value === 'stretch') {
                (info.metadata.stretchX = info.metadata.stretchX || []).push([bounds.left, bounds.right]);
                (info.metadata.stretchY = info.metadata.stretchY || []).push([bounds.top, bounds.bottom]);
            } else if (metadata.value === 'content' || metadata.value === 'text-placeholder') {
                const key = metadata.value === 'content' ? 'content' : 'placeholder';
                info.metadata[key] = [bounds.left, bounds.top, bounds.right, bounds.bottom];
            }
        }

        return true;
    }
};

const preparePluginsConfig = [
    {
        name: 'cleanupIDs',
        params: {
            // Remove all IDs first so that `convertPathData` resolves transforms.
            preservePrefixes: ['mapbox-']
        }
    },
    renameMapboxMetadata,
    'convertShapeToPath'
].map(resolvePluginConfig);

const collapsePluginsConfig = [
    'convertTransform',
    'moveGroupAttrsToElems',
    'collapseGroups'
].map(resolvePluginConfig);

const extractPluginsConfig = [
    removeStyleAttribute,
    {
        name: 'convertPathData',
        params: {
            // svg-boundings has trouble parsing consecutive numbers without space and without a leading
            // zero. Therefore, we force leading zeros. Note that this option confusingly has to be set
            // to _false_ to produce leading zeros.
            // See https://github.com/kfitfk/svg-boundings/issues/2
            leadingZero: false
        }
    },
    extractMapboxMetadata
].map(resolvePluginConfig);

/**
 * Parses a SVG document and extracts metadata from its shapes and paths.
 *
 * @param   {Object}                [img]
 * @param   {Buffer|string}         [img.svg]             A string of the SVG.
 * @param   {number}                [img.pixelRatio]      Ratio of a 72dpi screen pixel to the destination pixel density
 * @param   {Function}              callback              Accepts two arguments, `err` and `metadata` Object
 * @return  {Metadata}              metadata              An object with the extracted information.
 */
function extractMetadata(img, callback) {
    try {
        const imgSvg = Buffer.isBuffer(img.svg) ? img.svg.toString('utf-8') : img.svg;

        let result = parseSvg(imgSvg);

        // We'll add the metadata that we extract in the svgo plugin above to this object.
        const info = {
            metadata: {},
            pixelRatio: Number.isFinite(img.pixelRatio) && img.pixelRatio || 1
        };

        let previousSVG;
        let svg = img.svg;

        try {
            // A few initial plugins prepare the data, e.g. by moving IDs to custom attributes.
            result = invokePlugins(result, info, preparePluginsConfig);

            // We'll walk through the plugins that collapse groups until there are no changes to the output.
            do {
                previousSVG = svg;
                result = invokePlugins(result, info, collapsePluginsConfig);
                svg = stringifySvg(result).data;
            } while (previousSVG !== svg);

            // Finally, we'll run through the plugins that actually read and parse the metadata.
            invokePlugins(result, info, extractPluginsConfig);
        } catch (err) {
            return callback(err);
        }

        // Sort stretches ascendingly.
        for (const key of ['stretchX', 'stretchY']) {
            if (info.metadata[key]) {
                info.metadata[key].sort((a, b) => a[0] - b[0]);
            }
        }

        callback(null, info.metadata);
    } catch (err) {
        return callback(err);
    }
}

module.exports = extractMetadata;

/**
 * A `Metadata` objects stores information about how an image can be stretched in a non-linear
 *
 * The keys of the Object are the icon ids.
 * The values of the Object are the structured data about each icon.
 *
 * @typedef  {Object}    Metadata
 * @example
 * {
    *    {
    *      "content": [ 2, 5, 18, 11 ],
    *      "stretchX": [ [3, 7], [14, 18] ],
    *      "stretchY": [ [ 5, 11 ] ]
    *    }
    * }
    */
