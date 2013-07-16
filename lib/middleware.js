var {TemplateSyntaxError, TemplateDoesNotExist} = require('./errors');
var {Template} = require('./template');
var fs = require('fs');

var getErrorDetails = function(error) {
    var templateSource = error.templateSource;
    var templateString = templateSource[0].reload();
    var [start, end] = templateSource[1];
    var contextLines = 10;
    var before = "";
    var during = "";
    var after = "";
    var upto = 0;
    var lineNo = null;
    var templateLines = templateString.split('\n');
    templateLines.forEach(function(line, idx) {
        // +1 for linebreak
        var next = upto + (line.length + 1);
        if (start >= upto && end <= next) {
            lineNo = idx + 1;
            before = templateString.slice(upto, start);
            during = templateString.slice(start, end);
            after = templateString.slice(end, next);
        }
        upto = next;
    }, this);
    var top = Math.max(0, lineNo - contextLines);
    var bottom = Math.min(templateLines.length, lineNo + contextLines);
    var context = templateLines.slice(top, bottom);
    context = context.map(function(line) {
        return line.replace('\n', '');
    });
    return {
        templateName: templateSource[0].loadName,
        directories: templateSource[0].dirs,
        lineNo: lineNo,
        before: before,
        during: during,
        after: after,
        errorName: error.name || "Unknown error",
        errorMessage: error.message || 'An error occured',
        contextTop: top,
        contextLines: context,
    }
}

exports.middleware = function notfound(next, app) {

    app.reinhardtErrorTemplate = new Template(fs.read(module.resolve('./error.html')));

    return function reinhardtErrorHandler(request) {
        try {
            return next(request);
        } catch (e if (e instanceof TemplateSyntaxError) || (e instanceof TemplateDoesNotExist)) {
            // if debug=true, we have templateSource details
            // and can display detailed error message
            if (e.templateSource) {
                var errorContext = getErrorDetails(e)
                return {
                    status: 500,
                    headers: {"content-type": "text/html"},
                    body: [app.reinhardtErrorTemplate.render(errorContext)]
                }
            } else {
                return {
                    status: 500,
                    headers: {"content-type": "text/html"},
                    body: [e + " <br/> Enable DEBUG for details or check the logfile."]
                };
            }
        }
    };
};

