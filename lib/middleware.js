const {TemplateSyntaxError, TemplateDoesNotExist} = require('./errors');
const {Template} = require('./template');
const fs = require('fs');

const getErrorDetails = function(error) {
    const templateSource = error.templateSource;
    const templateString = templateSource[0].reload();
    const [start, end] = templateSource[1];
    const contextLines = 10;
    let before = "";
    let during = "";
    let after = "";
    let upto = 0;
    let lineNo = null;
    const templateLines = templateString.split('\n');
    templateLines.forEach(function(line, idx) {
        // +1 for linebreak
        const next = upto + (line.length + 1);
        if (start >= upto && end <= next) {
            lineNo = idx + 1;
            before = templateString.slice(upto, start);
            during = templateString.slice(start, end);
            after = templateString.slice(end, next);
        }
        upto = next;
    }, this);
    const top = Math.max(0, lineNo - contextLines);
    const bottom = Math.min(templateLines.length, lineNo + contextLines);
    const context = templateLines.slice(top, bottom).map(function(line) {
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
    };
};

exports.middleware = function notfound(next, app) {

    app.reinhardtErrorTemplate = new Template(fs.read(module.resolve('./error.html')));

    return function reinhardtErrorHandler(request) {
        try {
            return next(request);
        } catch (e if (e instanceof TemplateSyntaxError) || (e instanceof TemplateDoesNotExist)) {
            // if debug=true, we have templateSource details
            // and can display detailed error message
            if (e.templateSource) {
                const errorContext = getErrorDetails(e)
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

