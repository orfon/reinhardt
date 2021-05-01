const fs = require('fs');
const {safeJoin} = require('../utils/fs');

const LoaderOrigin = exports.LoaderOrigin = function(loader, loadName, dirs) {
    Object.defineProperties(this, {
        "loader": {"value": loader},
        "loadName": {"value": loadName},
        "dirs": {"value": dirs}
    });
    return this;
};

LoaderOrigin.prototype.reload = function() {
    return this.loader.loadTemplateSource(this.loadName)[0];
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

Loader.prototype.loadTemplateSource = function(templateName) {
    for (let i=0; i<this.templateDirs.length; i+=1) {
        let path = safeJoin(this.templateDirs[i], templateName)
        if (fs.exists(path) && fs.isFile(path)) {
            return [fs.read(path), new LoaderOrigin(this, templateName, this.templateDirs)];
        }
    }
    return [null];
};