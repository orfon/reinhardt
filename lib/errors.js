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
   			var sourceLines = [];
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
   				sourceLines.push([idx, escape(this.templateSource.slice(upto, next))]);
   			}, this);
   			var top = Math.max(0, lineNo - contextLines);
   			var bottom = Math.min(templateLines.length, lineNo + contextLines);
   			templateLines.splice(lineNo-1, 0, '<span style="color:red">');
   			templateLines.splice(lineNo+1, 0, '</span>');
   			var context = templateLines.slice(top, bottom);
   			context = context.join('<br/>');
   			return [ '<h2>', message || 'an error occured', '</h2>',
   				'<p>',
   				'In template "' + this.templateSource[0].loadName + '"',
   				' at line ' + lineNo,
   				'</p><p>',
   				before,
   				'<span style="margin-left:2em;border-bottom: 1px solid red;font-weight:bold">' + during + '</span>',
   				after,
   				'</p><h3>Context:</h3><p>'
   			].concat(context).concat(['</p>']);
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