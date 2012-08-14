var {Template} = require('./template');

var templateSourceLoaders = module.singleton('templateSourceLoaders', function() {
   return [];
})

exports.getTemplate = function(templateName) {
   for (var i = templateSourceLoaders.length-1; i>=0; i--) {
      var sourceLoader = templateSourceLoaders[i];
      var source = sourceLoader.loadTemplateSource(templateName);
      if (source) {
         if (!source.render || (typeof(source.render) != 'function')) {
            return new Template(source);
         }
         return source;
      }
   }
   throw new Error('Template does not exist "' + templateName + '"');
}

/**
 A loader must have a `loadTemplateSource(templateName)` function
 which must return the template in string form.
 All registered loaders are tried until one returns something.
 */
exports.register = function(loader) {
   if (!templateSourceLoaders) {
      templateSourceLoaders = [];
   }
   templateSourceLoaders.push(loader)
}

exports.reset = function() {
   templateSourceLoaders = [];
}