var $s = require('ringo/utils/strings');
var c = require('./constants');
var {Lexer} = require('./lexer');
var {Parser} = require('./parser');
var {Context} = require('./context');

var {DebugLexer, DebugParser} = require('./debug');

var StringOrigin = function(source) {
   this.source = source;
   return this;
}
StringOrigin.prototype.reload = function() {
   return this.source;
}

/**
 * Construct a template from a string
 * @param {String} templateString
 * @param {reinhardt/environment/Environment} environment optional
 */
var Template = exports.Template = function(templateString, environment, origin) {
   // FIXME if no environment passed here, create a default one

   if (origin == undefined && (environment == undefined || environment.DEBUG == true)) {
      origin = new StringOrigin(templateString);
   }
   this.origin = origin;
   if (environment && environment.DEBUG) {
      var lexer = new DebugLexer(templateString, origin);
      var parser = new DebugParser(lexer.tokenize(), environment, origin);
   } else {
      var lexer = new Lexer(templateString);
      var parser = new Parser(lexer.tokenize(), environment);
   }
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
   } finally {
      context.renderContext.pop();
   }
}

Template.prototype.toString = function() {
   return "[reinhardt Template]";
}