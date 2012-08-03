var {Template} = require('./template');

var templateSourceLoaders = [];
exports.getTemplate = function(templateName) {
   for (var i = templateSourceLoaders.length-1; i>=0; i--) {
      var sourceLoader = templateSourceLoaders[i];
      var source = sourceLoader.loadTemplateSource(templateName);
      if (source) {
         return new Template(source);
      }
   }
   throw new Error('Template does not exist "' + templateName + '"');
   return;
}

exports.register = function(loader) {
   templateSourceLoaders.push(loader)
}