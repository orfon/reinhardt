const {tokenKwargs} = require('../token');
const {Context} = require('../context');
const {TextNode, Node} = require('../nodes');
const {markSafe} = require('../utils');
const {TemplateSyntaxError} = require('../errors');

const BLOCK_CONTEXT_KEY = 'blockContext';

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
    let template = (typeof (this.templatePath) === 'string') ?
            this.templatePath :
            this.templatePath.resolve(context);
    // does this quack like a Template?
    if (!template || typeof (template.render) !== 'function') {
        template = this.env.getTemplate(template);
    }
    // render
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
};
ExtendsNode.prototype = Object.create(Node.prototype);
ExtendsNode.prototype.constructor = ExtendsNode;

ExtendsNode.prototype.getParent = function(context) {
    const parent = this.parentName.resolve(context);
    // FIXME parent is probably INVALID
    if (!parent) {
        throw new TemplateSyntaxError('Invalid template name in extends tag: ' + parent);
    }
    if (typeof (parent.render) === 'function') {
        return parent;
    }
    return this.env.getTemplate(parent);
};

ExtendsNode.prototype.render = function(context) {
    const compiledParent = this.getParent(context);
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
    const path = bits[1];
    if (['"', "'"].indexOf(path[0]) > -1 && path.slice(-1) === path[0]) {
        return new IncludeNode(path.slice(1, -1), extraContext, isolatedContext);
    }
    return new IncludeNode(parser.compileFilter(path), extraContext, isolatedContext);
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
    the parent tempate itelf (if it evaluates to a Template object).
*/

exports.extends = function(parser, token) {
    const bits = token.splitContents();
    if (bits.length !== 2) {
        throw new TemplateSyntaxError('"extends" takes one argument');
    }
    const parentName = parser.compileFilter(bits[1]);
    const nodeList = parser.parse();
    if (nodeList.getByType(ExtendsNode).length > 0) {
        throw new TemplateSyntaxError('"extends" cannot appear more than once in the same template');
    }
    return new ExtendsNode(nodeList, parentName);
};