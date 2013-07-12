var {escape} = require('./utils/html');

var TemplateSyntaxError = exports.TemplateSyntaxError = function(message) {
   Error.apply(this, arguments);
   this.name = "TemplateSyntaxError";
   this.headers = {'content-type': 'text/html'};
   this.status = 200;
   Object.defineProperty(this, 'body', {
   		get: function() {
   			var templateString = this.templateSource[0].reload();
   			var [start, end] = this.templateSource[1];
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
   					before = escape(templateString.slice(upto, start));
   					during = escape(templateString.slice(start, end));
   					after = escape(templateString.slice(end, next));
   				}
   				upto = next;
   			}, this);
   			var top = Math.max(0, lineNo - contextLines);
                        var bottom = Math.min(templateLines.length, lineNo + contextLines);
                        var context = templateLines.slice(top, bottom).map(escape);
                        context = context.map(function(c, idx) {
                           return (top+idx+1) + ' ' + c;
                        }).join('\n');
                        return [ '<h2>',
                                'TemplateSyntaxError in ' + this.templateSource[0].loadName,
                                ' at line ' + lineNo + ':',
                                '</h2>',
                                '<div style="margin-left:2em;">',
				'<p>',
                                before,
                                '<pre><span style="border-bottom: 1px solid red;">',
                                during,
                                '</span>',
                                after,
                                '</pre><p>',
                                 message || 'an error occured',
                                '</p></div><h2>',
                                this.templateSource[0].loadName,
                                ':</h2><pre>',
                        ].concat(context).concat(['</pre>', '<h2>Template search paths:</h2>']).concat(this.templateSource[0].dirs.join('<br/>'));
   		}
   })
   return this;
}

TemplateSyntaxError.prototype = new Error();
TemplateSyntaxError.prototype.constructor = TemplateSyntaxError;

var TemplateDoesNotExist = exports.TemplateDoesNotExist = function(message) {
   this.name = "TemplateDoesNotExist";
   this.headers = {'content-type': 'text/plain'};
   this.status = 200;
   this.body = [message || "an error occured"];
   return this;
}

TemplateDoesNotExist.prototype = new Error();
TemplateDoesNotExist.prototype.constructor = TemplateDoesNotExist;
