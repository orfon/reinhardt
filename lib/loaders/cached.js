var {Template} = require('../template');

/*
 Wrapper class that takes a list of template loaders as an argument and attempts
 to load templates from them in order, caching the result.
*/

var Loader = exports.Loader = function() {
   this.templateCache = {};
   this.loaders = Array.prototype.slice.apply(arguments, [0]);
   return this;
}

Loader.prototype.findTemplate = function(templateName) {
   var template = null;
   this.loaders.some(function(l) {
      template = l.loadTemplateSource(templateName);
      if (template) {
         return true;
      }
   }, this);
   if (!template) {
      throw new Error('Template does not exist');
   }
   return template;
}

Loader.prototype.loadTemplateSource = function(templateName) {
   var key  = templateName;
   if (!(key in this.templateCache)) {
      var template = this.findTemplate(templateName);
      if (!template.render || typeof(template.render) !== 'function') {
         template = new Template(template);
      }
      this.templateCache[key] = template;
   }
   return this.templateCache[key];
}

Loader.prototype.reset = function() {
   this.templateCache = {};
}