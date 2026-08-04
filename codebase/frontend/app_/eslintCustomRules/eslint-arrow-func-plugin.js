const arrowFuncRule = require('./eslint-arrow-func-rule');
const plugin = { rules: { 'prefer-arrow-functions-in-interfaces': arrowFuncRule } };
module.exports = plugin;
