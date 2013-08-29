var c = require('./constants');
var FilterExpression = require('./filterexpression').FilterExpression;
var {TextNode,VariableNode} = require('./nodes');
var {NodeList} = require('./nodelist');
var {TemplateSyntaxError} = require('./errors');

var Parser = exports.Parser = function(tokens, environment, origin) {
   this.origin = origin;
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
   var nodeList = this.createNodeList();

   while (this.tokens.length > 0) {
      var token = this.nextToken();
      if (token.tokenType === c.TOKEN_TEXT) {
         this.extendNodeList(nodeList, new TextNode(token.contents), token);
      } else if (token.tokenType === c.TOKEN_VAR) {
         if (!token.contents) {
            this.emptyVariable(token);
         }
         try {
            var filterExpression = this.compileFilter(token.contents);
         } catch (e if e instanceof TemplateSyntaxError) {
            this.compileFilterError(token, e);
            throw e;
         }
         var node = this.createVariableNode(filterExpression);
         this.extendNodeList(nodeList, node, token);
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
         this.enterCommand(command, token);
         var compileFunc = this.tags[command];
         if (!compileFunc || ! (typeof(compileFunc) == 'function')) {
            this.invalidBlockTag(token, command);
         }
         try {
            var compiledResult = compileFunc(this, token);
         } catch (e if e instanceof TemplateSyntaxError) {
            this.compileFunctionError(token, e);
            throw e;
         }
         this.extendNodeList(nodeList, compiledResult, token);
         this.exitCommand();
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
   throw this.error(token, 'Empty variable tag');
}

Parser.prototype.emptyBlockTag = function(token) {
   throw this.error(token, 'Empty block tag');
}

Parser.prototype.invalidBlockTag = function(token, command, parseUntil) {
   if (parseUntil) {
      throw this.error(token, "Invalid block tag: " + command + " expected " + parseUntil.join(', '));
   }
   throw this.error(token, 'Invalid block tag "' + command + '"');
}
Parser.prototype.unclosedBlockTag = function(parseUntil) {
   throw this.error(null, 'Unclosed tags: ' + parseUntil.join(', '));
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
Parser.prototype.createNodeList = function() {
   return new NodeList();
}

Parser.prototype.error = function(token, msg) {
   return new TemplateSyntaxError(msg);
}
Parser.prototype.enterCommand = function() {};
Parser.prototype.exitCommand = function() {};
Parser.prototype.compileFunctionError = function() {};
Parser.prototype.compileFilterError = function() {};