const Template = exports.Template = require('./template').Template;
const {Loader} = require('./loaders/filesystem');
const {TemplateDoesNotExist} = require('./errors');
const constants = require("./constants");

/**
 * Non standard properties are added to `config` property of the environment
 * and are accesible in nodes.
 * @param {Object} options configuration
 *
 */
exports.Environment = Environment = function(options) {
   if (typeof(options.loader) === 'string' || options.loader instanceof Array) {
      this.loader = new Loader(options.loader);
   } else {
      this.loader = options.loader;
   }
   this.extensions = {
      filters: options.filters,
      tags: options.tags
   };
   this.DEBUG = options.debug;
   if (options.stringIfUndefined !== undefined) {
      this.TEMPLATE_STRING_IF_INVALID = options.stringIfUndefined;
   } else {
      this.TEMPLATE_STRING_IF_INVALID = constants.TEMPLATE_STRING_IF_INVALID;
   }
   delete options.loader;
   delete options.filters;
   delete options.tags;
   delete options.debug;
   this.config = options;
   return this;
};

/**
 * @returns {Object} a JSGI response object
 */
Environment.prototype.renderResponse = function(templateName, context) {
   const template = this.getTemplate(templateName);
   return {
      status: 200,
      headers: {"Content-Type": "text/html; charset=utf-8"},
      body: [template.render(context)]
   };
}

/**
 * @returns {reinhardt/template/Template}
 */
Environment.prototype.getTemplate = function(templateName) {
   const [source, origin] = this.loader.loadTemplateSource(templateName);
   if (source) {
      if (!source.render || (typeof(source.render) != 'function')) {
         return new Template(source, this, !this.DEBUG ? undefined : origin);
      }
      return source;
   }
   throw new TemplateDoesNotExist('Template does not exist "' + templateName + '"');
};
