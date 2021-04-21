const {Template} = require('../template');
const {TemplateDoesNotExist} = require('../errors');
const {ConcurrentHashMap} = java.util.concurrent;

/*
 Wrapper class that takes a list of template loaders as an argument and attempts
 to load templates from them in order, caching the result.
*/

const Loader = exports.Loader = function() {
   Object.defineProperties(this, {
      templateCache: {value: new ConcurrentHashMap(100, 0.75, 1)},
      loaders: {value: Array.prototype.slice.call(arguments)}
   });
   return this;
};

Loader.prototype.findTemplate = function(templateName) {
   for (let i = 0; i < this.loaders.length; i += 1) {
      let loader = this.loaders[i];
      let [template, origin] = loader.loadTemplateSource(templateName);
      if (template) {
         return [template, origin];
      }
   }
   throw new TemplateDoesNotExist('Template does not exist');
};

Loader.prototype.loadTemplateSource = function(templateName) {
   const entry = this.templateCache.get(templateName);
   // @@ FIXME deal with origin
   if (!entry) {
      let [template, origin] = this.findTemplate(templateName);
      if (!template || typeof(template.render) !== 'function') {
         template = new Template(template);
      }
      this.templateCache.put(templateName, [template, origin]);
      return [template, origin];
   }
   return entry;
};

Loader.prototype.reset = function() {
   this.templateCache.clear();
};