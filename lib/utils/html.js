const {markSafe, isSafe} = require('../utils');

const convertToString = (text) => {
    if (typeof (text) !== 'string' && !(text instanceof String)) {
        if (text && typeof (text.toString) === 'function') {
            return text.toString();
        }
        return JSON.stringify(text);
    }
    return text;
};

/*
 Returns the given text with ampersands, quotes and angle brackets encoded for use in HTML.
*/
const escapeText = exports.escape = (text) => {
    if (text === undefined) {
        return;
    }
    return markSafe(convertToString(text)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;'));
};

/**
 Similar to escape(), except that it doesn't operate on pre-escaped strings.
 */
exports.conditionalEscape = (text) => {
    text = convertToString(text);
    if (!isSafe(text)) {
        return escapeText(text);
    }
    return text;
};