module.exports = {
    meta: {
        type: 'problem',
        hasSuggestions: false,
        fixable: false,
    },
    create(context) {
        return {
            'CallExpression[callee.name="it"]': (node) => {
                const testDescription = node.arguments[0];

                if (testDescription && testDescription.type === 'Literal' && typeof testDescription.value === 'string') {
                    const description = testDescription.value.trim();

                    if (!description.toLowerCase().startsWith('should')) {
                        context.report({
                            node: testDescription,
                            message: 'Test description should start with "should".',
                        });
                    }
                }
            },
        };
    },
};