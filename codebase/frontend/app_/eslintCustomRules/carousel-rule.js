module.exports = {
    meta: {
        type: 'problem',
        hasSuggestions: false,
        fixable: false,
    },
    create(context) {
        return {
            ImportDeclaration(node) {
                if (node.source.value === 'react-multi-carousel') {
                    for (const specifier of node.specifiers) {
                        if (
                            (specifier.type === 'ImportSpecifier' && specifier.imported.name === 'Carousel') ||
                            (specifier.type === 'ImportDefaultSpecifier' && specifier.local.name === 'Carousel')
                        ) {
                            context.report({
                                node: specifier,
                                message: 'Please use CarouselWrapper instead, as it includes accessibility fixes',
                            });
                        }
                    }
                }
            },
        };
    },
};
