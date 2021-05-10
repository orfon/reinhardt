const {Paths} = java.nio.file;

/*
    Joins one or more path components to the base path component intelligently.
    Returns a normalized, absolute version of the final path.

    The final path must be located inside of the base path component (otherwise
    a ValueError is raised).
 */
exports.safeJoin = function(base /*,... paths.. */) {
    const basePath = Paths.get(base).toAbsolutePath().normalize();
    const finalPath = Paths.get.apply(null, Array.prototype.slice.call(arguments)).toAbsolutePath().normalize();
    if (!finalPath.startsWith(basePath)) {
        throw new Error('The joined path "' + finalPath + '" is located outside of the base ' +
                ' path component "' + basePath + '"');
    }
    return finalPath.toString();
};