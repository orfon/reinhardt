const fs = require('fs');
const {safeJoin} = require('../utils/fs');

const LoaderOrigin = exports.LoaderOrigin = function(templateName, path, loader) {
    Object.defineProperties(this, {
        templateName: {value: templateName, enumerable: true},
        path: {value: path, enumerable: true},
        loader: {value: loader, enumerable: true}
    });
    return this;
};

LoaderOrigin.prototype.reload = function() {
    return this.loader.loadTemplateSource(this.templateName)[0];
};

const Loader = exports.Loader = function(dirs) {
    if (arguments.length > 1) {
        dirs = Array.prototype.slice.call(arguments);
    } else if (!Array.isArray(dirs)) {
        dirs = [dirs];
    }
    Object.defineProperties(this, {
        "templateDirs": {"value": dirs}
    });
    return this;
};

Loader.prototype.loadTemplateSource = function(templateName, environment, history) {
    for (let i=0; i<this.templateDirs.length; i+=1) {
        let path = safeJoin(this.templateDirs[i], templateName);
        if (!history.includes(path) && fs.exists(path) && fs.isFile(path)) {
            return [fs.read(path), new LoaderOrigin(templateName, path, this)];
        }
    }
    return [null];
};