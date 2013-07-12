var {Template} = require('../template');
var {TemplateDoesNotExist} = require('../errors');

/*
 Wrapper class that takes a list of template loaders as an argument and attempts
 to load templates from them in order, caching the result.
*/

var Loader = exports.Loader = function() {
   this.templateCache = new java.util.concurrent.ConcurrentHashMap(100, 0.75, 1);
   this.loaders = Array.prototype.slice.apply(arguments, [0]);
   return this;
}

Loader.prototype.findTemplate = function(templateName) {
   var template = null;
   var origin = null;
   this.loaders.some(function(l) {
      [template, origin] = l.loadTemplateSource(templateName);
      if (template) {
         return true;
      }
   }, this);
   if (!template) {
      throw new TemplateDoesNotExist('Template does not exist');
   }
   return [template, origin]
}

Loader.prototype.loadTemplateSource = function(templateName) {
   var result = this.templateCache.get(templateName);
   // @@ FIXME deal with origin
   if (result === null) {
      var [template, origin] = this.findTemplate(templateName);
      if (!template.render || typeof(template.render) !== 'function') {
         template = new Template(template);
      }
      result = this.templateCache.putIfAbsent(templateName, template);
      if (result == null) {
         result = template;
      }
   }
   return [result, origin];
}

Loader.prototype.reset = function() {
   this.templateCache.clear();
}