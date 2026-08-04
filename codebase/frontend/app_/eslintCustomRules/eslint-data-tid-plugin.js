const dataTidRule = require('./eslint-data-tid-rule');
const plugin = { rules: { 'data-tid-in-snake-case': dataTidRule } };
module.exports = plugin;