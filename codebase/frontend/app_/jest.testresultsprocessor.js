module.exports = function(results) {
    require('./node_modules/jest-html-reporter').apply(this, arguments);
    require('./node_modules/jest-teamcity-reporter').apply(this, arguments);
	return results;
};
