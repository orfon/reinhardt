const Reinhardt = exports.Reinhardt = require('./environment').Environment;
exports.middleware = require('./middleware').middleware;

const Env = function(args) {
    return Reinhardt.apply(this, args);
};
Env.prototype = Object.create(Reinhardt.prototype);
Env.prototype.constructor = Env;

/**
 * @ignore
 * @deprecated
 */
exports.Environment = function() {
    console.error('Deprecation warning: "Environment" was renamed to "Reinhardt"');
    return new Env(arguments);
}