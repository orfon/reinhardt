const {tokenKwargs} = require('../token');
const {Context} = require('../context');
const {TextNode, Node} = require('../nodes');
const {markSafe, isQuoted, unQuote} = require('../utils');
const {TemplateSyntaxError} = require('../errors');
const fs = require('fs');

const BLOCK_CONTEXT_KEY = 'blockContext';
const RELATIVE_PATH_RE = /^["']?\.{1,2}\//;

const getRelativePath = (current, relative) => {
    if (!current || !RELATIVE_PATH_RE.test(relative)) {
        return relative;
    }
    const hasQuotes = isQuoted(relative);
    if (hasQuotes) {
        relative = unQuote(relative);
    }
    relative = fs.resolve(current, relative);
    if (relative.startsWith("../")) {
        throw new TemplateSyntaxError("The relative path '" + relative +
                "' points outside the file hierarchy that '" + current + "' is in");
    }
    if (current === fs.resolve(relative)) {
        throw new TemplateSyntaxError("The relative path '" + relative +
                "' was translated to template name '" + current +
                "', the same template in which the tag appears.")
    }
    return hasQuotes ? '"' + relative + '"' : relative;
};

const getTemplate = (template, context, env) => {
    if (typeof(template) !== 'string') {
        template = template.resolve(context);
    }
    // does this quack like a Template?
    if (!template || typeof (template.render) !== 'function') {
        template = env.getTemplate(template);
    }
    return template;
};

const IncludeNode = function(templatePath, extraContext, isolatedContext) {
    Object.defineProperties(this, {
        extraContext: {value: extraContext},
        isolatedContext: {value: isolatedContext},
        templatePath: {value: templatePath}
    });
    return this;
};
IncludeNode.prototype = Object.create(Node.prototype);
IncludeNode.prototype.constructor = IncludeNode;

IncludeNode.prototype.render = function(context) {
    const template = getTemplate(this.templatePath, context, this.env);
    const values = Object.keys(this.extraContext).reduce((values, key) => {
        values[key] = this.extraContext[key].resolve(context);
        return values;
    }, {});
    if (this.isolatedContext) {
        return template.render(context.new(values));
    }
    context.update(values);
    const output = template.render(context);
    context.pop();
    return output;
};

/**
 *
 */
const BlockContext = function() {
    //Dictionary of FIFO queues.
    Object.defineProperties(this, {
        blocks: {value: {}}
    });
    return this;
};

BlockContext.prototype.addBlocks = function(blocks) {
    Object.keys(blocks).forEach(name => {
        const block = blocks[name];
        if (this.blocks.hasOwnProperty(name)) {
            this.blocks[name].unshift(block);
        } else {
            this.blocks[name] = [block];
        }
    });
};

BlockContext.prototype.pop = function(name) {
    if (this.blocks[name]) {
        return this.blocks[name].pop();
    }
    return null;
};

BlockContext.prototype.push = function(name, block) {
    this.blocks[name].push(block);
};
BlockContext.prototype.getBlock = function(name) {
    if (this.blocks.hasOwnProperty(name)) {
        return this.blocks[name].slice(-1)[0];
    }
    return null;
};

/**
 *
 */
const BlockNode = function(name, nodeList, parent) {
    Object.defineProperties(this, {
        name: {value: name, enumerable: true},
        nodeList: {value: nodeList, enumerable: true},
        parent: {value: parent || null, enumerable: true}
    });
    return this;
};
BlockNode.prototype = Object.create(Node.prototype);
BlockNode.prototype.constructor = BlockNode;

BlockNode.prototype.render = function(context) {
    const blockContext = context.renderContext.get(BLOCK_CONTEXT_KEY);
    context.push();
    let result;
    if (!blockContext) {
        context.set('block', this);
        result = this.nodeList.render(context);
    } else {
        const push = blockContext.pop(this.name);
        const block = new BlockNode(push.name, push.nodeList);
        block.context = context;
        context.set('block', block);
        result = block.nodeList.render(context);
        if (push) {
            blockContext.push(this.name, push);
        }
    }
    context.pop();
    return result;
};

// used in template to render the super block
BlockNode.prototype.super = function() {
    const renderContext = this.context.renderContext;
    if (renderContext.has(BLOCK_CONTEXT_KEY)) {
        if (renderContext.get(BLOCK_CONTEXT_KEY).getBlock(this.name)) {
            return markSafe(this.render(this.context));
        }
    }
    return markSafe('');
};

/**
 *
 */
const ExtendsNode = function(nodeList, parentName) {
    this.nodeList = nodeList;
    this.parentName = parentName;
    this.blocks = {};
    nodeList.getByType(BlockNode).forEach(node => {
        this.blocks[node.name] = node;
    });
    return this;
};
ExtendsNode.prototype = Object.create(Node.prototype);
ExtendsNode.prototype.constructor = ExtendsNode;

ExtendsNode.prototype.render = function(context) {
    const compiledParent = getTemplate(this.parentName, context, this.env);
    if (!context.renderContext.has(BLOCK_CONTEXT_KEY)) {
        context.renderContext.set(BLOCK_CONTEXT_KEY, new BlockContext());
    }
    const blockContext = context.renderContext.get(BLOCK_CONTEXT_KEY);
    blockContext.addBlocks(this.blocks);
    // If this block's parent doesn't have an extends node it is the root,
    // then its block nodes also need to be added to the block context.
    compiledParent.nodeList.contents.some(node => {
        if (!(node instanceof TextNode)) {
            if (!(node instanceof ExtendsNode)) {
                const blocks = {};
                compiledParent.nodeList.getByType(BlockNode).forEach(node => {
                    blocks[node.name] = node;
                });
                blockContext.addBlocks(blocks);
            }
            return true;
        }
        return false;
    });
    return compiledParent._render(context);
};


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
    const bits = token.splitContents();
    if (bits.length < 2) {
        throw new TemplateSyntaxError('include tag takes at least one argument: the name of the template to be included');
    }
    const options = {};
    const remainingBits = bits.slice(2);
    while (remainingBits.length > 0) {
        let option = remainingBits.shift();
        if (options.hasOwnProperty(option)) {
            throw new TemplateSyntaxError('"' + option + '" was specified more than once');
        }
        let value;
        if (option === 'with') {
            value = tokenKwargs(remainingBits, parser);
            if (Object.keys(value).length === 0) {
                throw new TemplateSyntaxError('"with" in include tags needs at least one arguments.')
            }
        } else if (option === 'only') {
            value = true;
        } else {
            throw new TemplateSyntaxError('Unknown argument for include tag: "' + option + '"')
        }
        options[option] = value;
    }
    const isolatedContext = options.only || false;
    const extraContext = options.with || {};
    const path = getRelativePath(parser.origin.loadName, bits[1]);
    return new IncludeNode(isQuoted(path) ? unQuote(path) : parser.compileFilter(path),
            extraContext, isolatedContext);
};

/*
 Define a block that can be overridden by child templates.
*/
exports.block = function(parser, token) {
    const bits = token.splitContents();
    if (bits.length !== 2) {
        throw new TemplateSyntaxError('"block" tag takes only one arguments');
    }
    const blockName = bits[1];
    if (parser.blocks.indexOf(blockName) > -1) {
        throw new TemplateSyntaxError('"block" tag with name "' + blockName + '" appears more than once');
    }
    parser.blocks.push(blockName);
    const nodeList = parser.parse(['endblock']);
    const endBlock = parser.nextToken();
    const acceptable = ['endblock', 'endblock ' + blockName];
    if (acceptable.indexOf(endBlock.contents) === -1) {
        parser.invalidBlockTag(endBlock, 'endblock')
    }
    return new BlockNode(blockName, nodeList);
};

/*
    Signal that this template extends a parent template.

    This tag may be used in two ways: ``{% extends "base" %}`` (with quotes)
    uses the literal value "base" as the name of the parent template to extend,
    or ``{% extends variable %}`` uses the value of ``variable`` as either the
    name of the parent template to extend (if it evaluates to a string) or as
    the parent tempate itself (if it evaluates to a Template object).
*/

exports.extends = function(parser, token) {
    const bits = token.splitContents();
    if (bits.length !== 2) {
        throw new TemplateSyntaxError('"extends" takes one argument');
    }
    const nodeList = parser.parse();
    if (nodeList.getByType(ExtendsNode).length > 0) {
        throw new TemplateSyntaxError('"extends" cannot appear more than once in the same template');
    }
    const parent = getRelativePath(parser.origin.loadName, bits[1]);
    return new ExtendsNode(nodeList, 
            isQuoted(parent) ? unQuote(parent) : parser.compileFilter(parent));
};