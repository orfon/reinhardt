var Reinhardt = exports.Reinhardt = require('./environment').Environment;
exports.middleware = require('./middleware').middleware;

/**
 * @ignore
 * @deprecated
 */
exports.Environment = function() {
   console.error('Deprecation warning: "Environment" was renamed to "Reinhardt"');
   function Env(args) {
      return Reinhardt.apply(this, args)
   }
   Env.prototype = Reinhardt.prototype;
   return new Env(arguments);
}