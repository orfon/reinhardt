var fs = require('fs');

var templateDirs = exports.templateDirs = null;

var Loader = exports.Loader = function() {
   this.isUsable = templateDirs !== null && templateDirs.length > 0;
   this.isUsable = templateDirs.every(function(d) {
      return fs.exists(d) || fs.isDirectory(d);
   });
   return this;
}

/**
        Returns the absolute paths to "template_name", when appended to each
        directory in "template_dirs". Any paths that don't lie inside one of the
        template dirs are excluded from the result set, for security reasons.
*/
// FIXME security
Loader.prototype.getTemplateSources = function(templateName) {
   return templateDirs.map(function(d) {
      return fs.join(d, templateName);
   });
}

Loader.prototype.loadTemplateSource = function(templateName) {
   var source = null;
   this.getTemplateSources(templateName).some(function(templatePath) {
      if (fs.exists(templatePath) && fs.isFile(templatePath)) {
         source = fs.read(templatePath);
         return true;
      }
   });
   return source;
}