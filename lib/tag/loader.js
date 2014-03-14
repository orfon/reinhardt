var {tokenKwargs} = require('../token');
var {Context} = require('../context');
var {TextNode, Node} = require('../nodes');
var {markSafe} = require('../utils');
var {TemplateSyntaxError} = require('../errors');

var BLOCK_CONTEXT_KEY = 'blockContext';

var IncludeNode = function(templatePath, extraContext, isolatedContext) {
   this.extraContext = extraContext;
   this.isolatedContext = isolatedContext;
   this.templatePath = templatePath;
   return this;
}
IncludeNode.prototype.getByType = Node.prototype.getByType;

IncludeNode.prototype.render = function(context) {
   if (typeof(this.templatePath) === 'string') {
      var template = this.templatePath;
   } else {
      var template = this.templatePath.resolve(context);
   }
   // does this quack like a Template?
   if (typeof(template.render) !== 'function') {
      template = this.env.getTemplate(template);
   }
   // render
   var values = {};
   for (var key in this.extraContext) {
      values[key] = this.extraContext[key].resolve(context);
   }
   if (this.isolatedContext) {
      return template.render(context.new(values));
   }
   context.update(values);
   var output = template.render(context);
   context.pop();
   return output;
}

/**
 *
 */
var BlockContext = function() {
   //Dictionary of FIFO queues.
   this.blocks = {};
   return this;
}
BlockContext.prototype.addBlocks = function(blocks) {
   for (var name in blocks) {
      var block = blocks[name];
      if (name in this.blocks) {
         this.blocks[name].unshift(block);
      } else {
         this.blocks[name] = [block];
      }
   }
}

BlockContext.prototype.pop = function(name) {
   if (this.blocks[name]) {
      return this.blocks[name].pop();
   }
   return null;
}

BlockContext.prototype.push = function(name, block) {
   this.blocks[name].push(block);
}
BlockContext.prototype.getBlock = function(name) {
   if (name in this.blocks) {
      return this.blocks[name].slice(-1)[0];
   }
   return null;
}

/**
 *
 */
var BlockNode = function (name, nodeList, parent) {
   this.name = name;
   this.nodeList = nodeList;
   this.parent = parent || null;
   return this;
}
BlockNode.prototype.getByType = Node.prototype.getByType;

BlockNode.prototype.render = function(context) {
   var blockContext = context.renderContext.get(BLOCK_CONTEXT_KEY);
   context.push();
   if (!blockContext) {
      context.set('block', this);
      var result = this.nodeList.render(context);
   } else {
      var push = block = blockContext.pop(this.name);
      var block = new BlockNode(block.name, block.nodeList);
      block.context = context;
      context.set('block', block);
      var result = block.nodeList.render(context);
      if (push) {
         blockContext.push(this.name, push);
      }
   }
   context.pop();
   return result;
}

// used in template to render the super block
BlockNode.prototype.super = function() {
   var renderContext = this.context.renderContext;
   if (renderContext.has(BLOCK_CONTEXT_KEY)) {
      if (renderContext.get(BLOCK_CONTEXT_KEY).getBlock(this.name)) {
         return markSafe(this.render(this.context));
      }
   }
   return markSafe('');
}

/**
 *
 */
var ExtendsNode = function(nodeList, parentName) {
   this.nodeList = nodeList;
   this.parentName = parentName;
   this.blocks = {};
   var blockNodes = nodeList.getByType(BlockNode);
   blockNodes.forEach(function(n) {
      this.blocks[n.name] = n;
   }, this);
}
ExtendsNode.prototype.getByType = Node.prototype.getByType;

ExtendsNode.prototype.getParent = function(context) {
   var parent = this.parentName.resolve(context);
   // FIXME parent is probably INVALID
   if (!parent) {
      throw new TemplateSyntaxError('Invalid template name in extends tag: ' + parent);
   }
   if (parent.render && typeof(parent.render) === 'function') {
      return parent;
   }
   return this.env.getTemplate(parent);
}

ExtendsNode.prototype.render = function(context) {
   var compiledParent = this.getParent(context);
   if (!context.renderContext.has(BLOCK_CONTEXT_KEY)) {
      context.renderContext.set(BLOCK_CONTEXT_KEY, new BlockContext());
   }
   var blockContext = context.renderContext.get(BLOCK_CONTEXT_KEY);
   blockContext.addBlocks(this.blocks);
   // If this block's parent doesn't have an extends node it is the root,
   // then its block nodes also need to be added to the block context.
   compiledParent.nodeList.contents.some(function(node) {
      if (! (node instanceof TextNode) ) {
         if (! (node instanceof ExtendsNode)) {
            var blocks = {};
            compiledParent.nodeList.getByType(BlockNode).forEach(function(node) {
               blocks[node.name] = node;
            }, this);
            blockContext.addBlocks(blocks);
         }
         return true;
      }
      return false;
   }, this);
   return compiledParent._render(context);
}


/**
    Loads a template and renders it with the current context. You can pass
    additional context using keyword arguments.

    Example::

        {% include "foo/some_include" %}
        {% include "foo/some_include" with bar="BAZZ!" baz="BING!" %}

    Use the ``only`` argument to exclude the current context when rendering
    the included template::

        {% include "foo/some_include" only %}
        {% include "foo/some_include" with bar="1" only %}
 */

exports.include = function(parser, token) {
   var bits = token.splitContents();
   if (bits.length < 2) {
      throw new TemplateSyntaxError('include tag takes at least one argument: the name of the template to be included');
   }
   var options = {};
   var remainingBits = bits.slice(2);
   while (remainingBits.length > 0) {
      var option = remainingBits.shift();
      if (option in options) {
         throw new TemplateSyntaxError('"' + option +'" was specified more than once');
      }
      if (option == 'with') {
         var value = tokenKwargs(remainingBits, parser);
         if (Object.keys(value).length <= 0) {
            throw new TemplateSyntaxError('"with" in include tags needs at least one arguments.')
         }
      } else if (option == 'only') {
         var value = true;
      } else {
         throw new TemplateSyntaxError('Unknown argument for include tag: "'+ option +'"')
      }
      options[option] = value;
   }
   var isolatedContext = options.only || false;
   var extraContext = options.with || {};
   var path = bits[1];
   if ( ['"', "'"].indexOf(path[0]) > -1 && path.slice(-1) === path[0]) {
      return new IncludeNode(path.slice(1, -1), extraContext, isolatedContext);
   }
   return new IncludeNode(parser.compileFilter(path), extraContext, isolatedContext);
}

/*
 Define a block that can be overridden by child templates.
*/
exports.block = function(parser, token) {
   var bits = token.splitContents();
   if (bits.length != 2) {
      throw new TemplateSyntaxError('"block" tag takes only one arguments');
   }
   var blockName = bits[1];
   if (parser.blocks.indexOf(blockName) > -1) {
      throw new TemplateSyntaxError('"block" tag with name "' + blockName +'" appears more than once');
   }
   parser.blocks.push(blockName);
   var nodeList = parser.parse(['endblock']);
   var endBlock = parser.nextToken();
   var acceptable = ['endblock', 'endblock ' + blockName];
   if (acceptable.indexOf(endBlock.contents) == -1) {
      parser.invalidBlockTag(endBlock, 'endblock')
   }
   return new BlockNode(blockName, nodeList);
}

/*
    Signal that this template extends a parent template.

    This tag may be used in two ways: ``{% extends "base" %}`` (with quotes)
    uses the literal value "base" as the name of the parent template to extend,
    or ``{% extends variable %}`` uses the value of ``variable`` as either the
    name of the parent template to extend (if it evaluates to a string) or as
    the parent tempate itelf (if it evaluates to a Template object).
*/

exports.extends = function(parser, token) {
   var bits = token.splitContents();
   if (bits.length != 2) {
      throw new TemplateSyntaxError('"extends" takes one argument');
   }
   var parentName = parser.compileFilter(bits[1]);
   var nodeList = parser.parse();
   if (nodeList.getByType(ExtendsNode).length > 0) {
      throw new TemplateSyntaxError('"extends" cannot appear more than once in the same template');
   }
   return new ExtendsNode(nodeList, parentName);
}