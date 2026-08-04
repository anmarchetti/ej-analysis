export const customPortalStyles = {
    menu: (base: CSSStyleDeclaration): CSSStyleDeclaration => ({
        ...base,
        marginTop: '0px',
        zIndex: '10',
        backgroundColor: '#fff',
        border: '1px solid #a9b9bd',
        borderRadius: '6px',
    }),
    menuList: (base: CSSStyleDeclaration): CSSStyleDeclaration => ({
        ...base,
        padding: '0px',
    }),
    option: (
        base: CSSStyleDeclaration,
        state: { isDisabled: boolean; isFocused: boolean; isSelected: boolean },
    ): CSSStyleDeclaration => {
        let color = '#333';
        let bgColor = '';

        if (state.isFocused) {
            color = '#ff4600';
            bgColor = 'transparent';
        }

        if (state.isDisabled) {
            color = '#a9b9bd';
        }

        if (state.isSelected) {
            color = '#ff7d00';
            bgColor = '#f1f5f6';
        }

        return {
            ...base,
            backgroundColor: bgColor,
            color,
            cursor: state.isDisabled ? 'default' : 'pointer',
            padding: '10px 12px',
            fontFamily: 'easyjet_rounded_book, Arial, Helvetica, sans-serif',
            fontSize: '15px',
            lineHeight: '24px',
        };
    },
};
