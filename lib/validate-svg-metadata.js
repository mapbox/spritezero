/**
 * Validates metadata that is parsed from an SVG metadata
 *
 * @param   {Object}                img              An image object with `width` and `height`.
 * @param   {Metadata}              metadata         A metadata object.
 * @return  {null|Error}            err              An `Error` object if validation fails, `null` otherwise.
 */
function validateMetadata(img, metadata) {
    if (!img || typeof img !== 'object') {
        return new Error('image is invalid');
    }

    if (!metadata || typeof metadata !== 'object') {
        return new Error('image has invalid metadata');
    }

    if (typeof img.width !== 'number' || img.width <= 0) {
        return new Error('image has invalid width');
    }

    if (typeof img.height !== 'number' || img.height <= 0) {
        return new Error('image has invalid height');
    }

    if ('content' in metadata) {
        const content = metadata.content;
        if (!Array.isArray(content) || content.length !== 4 ||
            typeof content[0] !== 'number' || typeof content[1] !== 'number' ||
            typeof content[2] !== 'number' || typeof content[3] !== 'number') {
            return new Error('image content area must be an array of 4 numbers');
        }

        if (content[0] >= content[2] || content[1] >= content[3]) {
            return new Error('image content area must be positive');
        }

        if (content[0] < 0 || content[2] > img.width ||
            content[1] < 0 || content[3] > img.height) {
            return new Error('image content area must be within image bounds');
        }
    }

    for (const key of ['stretchX', 'stretchY']) {
        if (key in metadata) {
            const stretches = metadata[key];
            if (!Array.isArray(stretches)) {
                return new Error(`image ${key} zones must be an array`);
            }

            for (const zone of stretches) {
                if (!Array.isArray(zone) || zone.length !== 2 ||
                    typeof zone[0] !== 'number' || typeof zone[1] !== 'number') {
                    return new Error(`image ${key} zone must consist of two numbers`);
                }

                if (zone[0] >= zone[1]) {
                    return new Error(`image ${key} zone may not be zero-size`);
                }

                if (zone[0] < 0 || zone[1] > img.width) {
                    return new Error(`image ${key} zone must be within image bounds`);
                }
            }

            for (let i = 1; i < stretches.length; i++) {
                // Make sure that the previous stretch's end coordinate is
                // smaller than this stretch's begin coordinate. Expects that
                // stretch zones are sorted ascendingly by their first coordinate.
                if (stretches[i][0] <= stretches[i - 1][1]) {
                    return new Error(`image ${key} zones may not overlap`);
                }
            }
        }
    }

    return null;
}
module.exports = validateMetadata;
