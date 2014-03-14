exports.TOKEN_TEXT = 0;
exports.TOKEN_VAR = 1;
exports.TOKEN_BLOCK = 2;
exports.TOKEN_COMMENT = 3;
exports.TOKEN_MAPPING = {
    TOKEN_TEXT: 'Text',
    TOKEN_VAR: 'Var',
    TOKEN_BLOCK: 'Block',
    TOKEN_COMMENT: 'Comment',
}

// template syntax constants
exports.FILTER_SEPARATOR = '|';
exports.FILTER_ARGUMENT_SEPARATOR = ':';
exports.VARIABLE_ATTRIBUTE_SEPARATOR = '.';
exports.BLOCK_TAG_START = '{%';
exports.BLOCK_TAG_END = '%}';
exports.VARIABLE_TAG_START = '{{';
exports.VARIABLE_TAG_END = '}}';
exports.COMMENT_TAG_START = '{#';
exports.COMMENT_TAG_END = '#}';
// unused TRANSLATOR_COMMENT_MARK = 'Translators';
exports.SINGLE_BRACE_START = '{';
exports.SINGLE_BRACE_END = '}';

exports.ALLOWED_VARIABLE_CHARS = 'abcdefghijklmnopqrstuvwxyz' +
                         'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789_.';

// match a variable or block tag and capture the entire tag, including start/end
// delimiters

var rEsc = exports.regexEscape = function(str) {
   return str.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&');
}

exports.tagRe = new RegExp('(' + rEsc(exports.BLOCK_TAG_START) + '.*?' + rEsc(exports.BLOCK_TAG_END) + '|' +
      rEsc(exports.VARIABLE_TAG_START) + '.*?' + rEsc(exports.VARIABLE_TAG_END) + '|' +
      rEsc(exports.COMMENT_TAG_START) + '.*?' + rEsc(exports.COMMENT_TAG_END) + ')', 'g');

exports.TEMPLATE_STRING_IF_INVALID = '';