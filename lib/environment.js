var Template = exports.Template = require('./template').Template;
var Context = exports.Context = require('./context').Context;
var {Loader} = require('./loaders/filesystem');
var $o = require('ringo/utils/objects');
var {TemplateDoesNotExist} = require('./errors');
var constants = require("./constants");

/**
 * Non standard properties are added to `config` property of the environment
 * and are accesible in nodes.
 * @param {Object} configuration
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
   var [source, origin] = this.loader.loadTemplateSource(templateName);
   if (source) {
      if (!source.render || (typeof(source.render) != 'function')) {
         if (this.DEBUG == false) {
            origin = undefined;
         }
         return new Template(source, this, origin);
      }
      return source;
   }
   throw new TemplateDoesNotExist('Template does not exist "' + templateName + '"');
}
