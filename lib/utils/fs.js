var fs = require('fs');
var $s = require('ringo/utils/strings');

/*
    Joins one or more path components to the base path component intelligently.
    Returns a normalized, absolute version of the final path.

    The final path must be located inside of the base path component (otherwise
    a ValueError is raised).
 */
var SEP = java.io.File.separator;
exports.safeJoin = function(base /*,... paths.. */) {
   var paths = Array.slice(arguments, 1);
   paths = Array.filter(paths, function(p) p.trim() != "");
   var finalPath = fs.absolute(fs.join(base, paths));
   var basePath = fs.absolute(base);
   var basePathLen = basePath.slice(-1) === SEP ? basePath.length - 1 : basePath.length;
   // NOTE this won't work on windows, we would have to
   // normalize the case and slashes, see python's
   // os.normcase
   if ($s.startsWith(finalPath, basePath) == false ||
      ['', SEP].indexOf(finalPath.slice(basePathLen, basePathLen+1)) == -1) {
      throw new Error('The joined path "' + finalPath + '" is located outside of the base ' +
         ' path component "' + basePath + '"');
   }
   return finalPath;

}