const {markSafe, isSafe} = require('../utils');
const html = require('../utils/html');

const _linebreaksrn = /(\r\n|\n\r)/g;
const _linebreaksn = /\n{2,}/g;
const _linebreakss = /(^\s+|\s+$)/g;
const _linebreaksbr = /\n/g;
const _removetagsfind = /[a-z0-9]+/g;
const _striptags = /<[^>]*?>/g;

exports.linebreaks = function(value, autoescape){
   // summary:
   //    Converts newlines into `<p>` and `<br />`s
   const output = [];
   const valueSingleN = value.replace(_linebreaksrn, "\n");
   const parts = valueSingleN.split(_linebreaksn);
   for (let i = 0; i < parts.length; i++){
      let part = parts[i];
      if (autoescape === true && isSafe(value) === false) {
         part = html.escape(part);
      }
      part = part.replace(_linebreakss, "").replace(_linebreaksbr, "<br />");
      output.push("<p>" + part + "</p>");
   }

   return markSafe(output.join("\n\n"));
};
exports.linebreaks.isSafe = true;
exports.linebreaks.needsAutoescape = true;

exports.linebreaksbr = function(value, autoescape){
   // summary:
   //    Converts newlines into `<br />`s
   if (autoescape === true && isSafe(value) === false) {
      value = html.escape(value);
   }
   return markSafe(value.replace(_linebreaksrn, "\n").replace(_linebreaksbr, "<br />"));
};
exports.linebreaksbr.isSafe = true;
exports.linebreaksbr.needsAutoescape = true;

exports.removetags = function(value, arg){
   // summary:
   //    Removes a space separated list of [X]HTML tags from the output"
   let tags = [];
   let group;
   while(group = _removetagsfind.exec(arg)){
      tags.push(group[0]);
   }
   tags = "(" + tags.join("|") + ")";
   return value.replace(new RegExp("</?\s*" + tags + "\s*[^>]*>", "gi"), "");
};
exports.removetags.isSafe = true;

exports.striptags = function(value){
   // summary:
   //    Strips all [X]HTML tags
   return value.replace(_striptags, "");
};
exports.striptags.isSafe = true;