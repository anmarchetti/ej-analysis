module.exports = {
    meta: {
        type: 'problem',
        hasSuggestions: false,
        fixable: false,
    },
    create(context) {
        return {
            ['JSXAttribute, Property'](node) {

                if(node?.name?.name !== 'data-tid' && node?.name?.name !== 'dataTid' && node?.key?.name !== 'dataTid') {
                    return
                }

                const value = node.value.value
                const regex = new RegExp(/^([a-z0-9]*|-[a-z0-9]*)*$/);

                const isValidValue = regex.test(value);

                if (!isValidValue) {
                    context.report({
                        node,
                        message: `Value of data-tid attributes should be in snake-case (${value})`,
                    });
                }

            }
        };
    }
};