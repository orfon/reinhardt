const fs = require('fs');
const strings = require('ringo/utils/strings');

/*
    Joins one or more path components to the base path component intelligently.
    Returns a normalized, absolute version of the final path.

    The final path must be located inside of the base path component (otherwise
    a ValueError is raised).
 */
const SEPARATOR = java.io.File.separator;

exports.safeJoin = function(base /*,... paths.. */) {
    const finalPath = fs.absolute(fs.join.apply(null, arguments));
    const basePath = fs.absolute(base);
    const basePathLen = basePath.slice(-1) === SEPARATOR ? basePath.length - 1 : basePath.length;
    // NOTE this won't work on windows, we would have to
    // normalize the case and slashes, see python's
    // os.normcase
    if (!finalPath.startsWith(basePath) ||
            !['', SEPARATOR].includes(finalPath.slice(basePathLen, basePathLen + 1))) {
        throw new Error('The joined path "' + finalPath + '" is located outside of the base ' +
                ' path component "' + basePath + '"');
    }
    return finalPath;
};