module.exports = {
    meta: {
        type: 'problem',
        hasSuggestions: false,
        fixable: false,
    },
    create(context) {
        return {
            TSMethodSignature(node) {
                context.report({
                    node,
                    message: 'Functions in interfaces should be typed as properties with an arrow function, not as method signatures. Change `test(): void` to `test: () => void`.'
                });
            }
        };
    }
};
