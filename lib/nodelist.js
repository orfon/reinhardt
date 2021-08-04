const {markSafe} = require('./utils');

const NodeList = exports.NodeList = function() {
    Object.defineProperties(this, {
        contents: {value: [], enumerable: true}
    });
    return this;
};

NodeList.prototype.push = function(c) {
    this.contents.push(c);
};

NodeList.prototype.render = function(context) {
    const buffer = this.contents.map(content => {
        // FIXME if instanceof Node...
        if (content && typeof (content.render) === 'function') {
            return this.renderNode(content, context);
        }
        return content;
    })
    return markSafe(buffer.join(""));
};

NodeList.prototype.renderNode = function(node, context) {
    return node.render(context);
};

NodeList.prototype.getByType = function(type) {
    return this.contents.reduce((nodes, node) => {
        return nodes.concat(node.getByType(type));
    }, []);
};

NodeList.prototype.setEnvironment = function(env) {
    this.contents.forEach(node => {
        // this is duck typed `node instanceof NodeList`.
        // e.g. the IfNode is not instanceof NodeList but needs to handle
        // setEnvironment.
        if (typeof (node.setEnvironment) === 'function') {
            node.setEnvironment(env);
        } else {
            // otherwise set the `env` directly on the node
            // and search the node for other NodeLists (we don't use duck typing here 
            // because those objects are less under our control than the things
            // in a nodelist and could accidently have setEnvironment)
            node.env = env;
            Object.keys(node).forEach(key => {
                const value = node[key];
                if (value instanceof NodeList) {
                    value.setEnvironment(env);
                }
            });
        }
    });
}