var Template = exports.Template = require('./template').Template;
var Context = exports.Context = require('./context').Context;
var {Loader} = require('reinhardt/loaders/filesystem');

/**
 * @param {Object} configuration
 */
exports.Environment = Environment = function({loader, filters, tags}) {
   if (typeof(loader) === 'string') {
      this.loader = new Loader(loader);
   } else if (loader instanceof Array) {
      this.loader = new Loader(loader);
   } else {
      this.loader = loader;
   }
   this.extensions = {
      filters: filters,
      tags: tags
   }
   return this;
}

/**
 * @returns {Object} a JSGI response object
 */
Environment.prototype.renderResponse = function(templateName, context) {
   var t = this.getTemplate(templateName);
   return {
      status: 200,
      headers: {"Content-Type": "text/html; charset=utf-8"},
      body: [t.render(context)]
   };
}

/**
 * @returns {reinhardt/template/Template}
 */
Environment.prototype.getTemplate = function(templateName) {
   var source = this.loader.loadTemplateSource(templateName);
   if (source) {
      if (!source.render || (typeof(source.render) != 'function')) {
         return new Template(source, this);
      }
      return source;
   }
   throw new Error('Template does not exist "' + templateName + '"');
}
