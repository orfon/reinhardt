var c = require('./constants');
var FilterExpression = require('./filterexpression').FilterExpression;
var {TextNode,VariableNode} = require('./nodes');
var {NodeList} = require('./nodelist');
var {TemplateSyntaxError} = require('./errors');

var Parser = exports.Parser = function(tokens, environment) {
   this.environment = environment;
   this.tokens = tokens;
   this.tags = {};
   this.filters = {};
   // for {% block %}
   this.blocks = [];
   // for {% cycle .. as .. %}
   this.namedCycleNodes = {};
   this.addTags(require('./tag/logic'));
   this.addTags(require('./tag/loop'));
   this.addTags(require('./tag/loader'));
   this.addTags(require('./tag/misc'));
   this.addFilters(require('./filter/arrays'));
   this.addFilters(require('./filter/dates'));
   this.addFilters(require('./filter/logic'));
   this.addFilters(require('./filter/strings'));
   this.addFilters(require('./filter/htmlstrings'));
   this.addFilters(require('./filter/objects'));

   if (this.environment) {
      this.addEnvironmentExtensions();
   }
   return this;
}

Parser.prototype.addEnvironmentExtensions = function() {
   if (this.environment.extensions.filters) {
      var filterExt = this.environment.extensions.filters;
      if (!(filterExt instanceof Array)) {
         filterExt = [filterExt];
      }
      filterExt.forEach(function(fe) {
         this.addFilters(fe);
      }, this);
   }
   if (this.environment.extensions.tags) {
      var tagExt = this.environment.extensions.tags;
      if (!(tagExt instanceof Array)) {
         tagExt = [tagExt];
      }
      tagExt.forEach(function(te) {
         this.addTags(te);
      }, this);
   }
}

Parser.prototype.parse = function(parseUntil) {
   parseUntil = parseUntil || [];
   var nodeList = new NodeList();

   while (this.tokens.length > 0) {
      var token = this.nextToken();
      if (token.tokenType === c.TOKEN_TEXT) {
         this.extendNodeList(nodeList, new TextNode(token.contents));
      } else if (token.tokenType === c.TOKEN_VAR) {
         if (!token.contents) {
            this.emptyVariable(token);
         }
         var filterExpression = this.compileFilter(token.contents);
         var node = this.createVariableNode(filterExpression);
         this.extendNodeList(nodeList, node);
      } else if (token.tokenType === c.TOKEN_BLOCK) {
         try {
            var command = token.contents.split(' ')[0];
         } catch (e) {
            this.emptyBlockTag(token);
         }
         if (parseUntil.indexOf(command) > -1) {
            this.prependToken(token);
            return nodeList;
         }
         // FIXME a debug mode would output additional information
         // here about what it called / inserted.

         var compileFunc = this.tags[command];
         if (!compileFunc || ! (typeof(compileFunc) == 'function')) {
            this.invalidBlockTag(token, command);
         }
         var compiledResult = compileFunc(this, token);
         this.extendNodeList(nodeList, compiledResult);
      }
   }
   if (parseUntil.length > 0) {
      this.unclosedBlockTag(parseUntil);
   }
   nodeList.setEnvironment(this.environment);
   return nodeList;
}

Parser.prototype.prependToken = function(token) {
   this.tokens.unshift(token);
}
Parser.prototype.createVariableNode = function(filterExpression) {
   return new VariableNode(filterExpression)
}

Parser.prototype.nextToken = function() {
   return this.tokens.shift();
}
Parser.prototype.compileFilter = function(token) {
   return new FilterExpression(token, this);
}

Parser.prototype.extendNodeList = function(nodeList, node) {
   if (node.mustBeFirst && this.nodelist.length > 0) {
      throw new TemplateSyntaxError("must be first tag in template");
   }
   // FIXME what does the containsNoText thing do? why attributeerror?
   nodeList.push(node);
   return;
}

Parser.prototype.emptyVariable = function(token) {
   throw new TemplateSyntaxError('Empty variable tag');
}

Parser.prototype.emptyBlockTag = function(token) {
   throw new TemplateSyntaxError('Empty block tag');
}

Parser.prototype.invalidBlockTag = function(token, command) {
   throw new TemplateSyntaxError('Invalid block tag "' + command + '" in "' + token.contents + '"');
}
Parser.prototype.unclosedBlockTag = function(parseUntil) {
   throw new TemplateSyntaxError('Unclosed tags: ' + parseUntil.join(', '));
}

Parser.prototype.addTags = function(lib) {
   for (var key in lib) {
      this.tags[key] = lib[key];
   }
}

Parser.prototype.addFilters= function(lib) {
   for (var key in lib) {
      this.filters[key] = lib[key];
   }
}

Parser.prototype.deleteFirstToken = function() {
   this.tokens.shift();
}

Parser.prototype.skipPast = function(endTag) {
   while (this.tokens.length > 0) {
      var token = this.nextToken();
      if (token.tokenType === c.TOKEN_BLOCK && token.contents == endTag) {
         return;
      }
   }
   this.unclosedBlockTag([endTag]);
}