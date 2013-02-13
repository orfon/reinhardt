var $s = require('ringo/utils/strings');
var c = require('./constants');
var {Lexer} = require('./lexer');
var {Parser} = require('./parser');
var {Context} = require('./context');

/**
 * Construct a template from a string
 * @param {String} templateString
 * @param {reinhardt/environment/Environment} environment optional
 */
var Template = exports.Template = function(templateString, environment) {
   // FIXME if no environment passed here
   // create a default env
   var lexer = new Lexer(templateString);
   var parser = new Parser(lexer.tokenize(), environment);
   this.nodeList = parser.parse();
   return this;
}

/** @ignore **/
Template.prototype._render = function(context) {
   return this.nodeList.render(context).toString();
}

/**
 * @returns {String} the rendered template
 */
Template.prototype.render = function(context) {
   context = context || new Context();
   if (! (context instanceof Context)) {
      context = new Context(context);
   }
   context.renderContext.push();
   try {
      return this._render(context);
   }catch (e) {
      throw e;
   } finally {
      context.renderContext.pop();
   }
}

Template.prototype.toString = function() {
   return "[reinhardt Template]";
}