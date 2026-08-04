import { customPortalStyles } from './ValidatableSelectField.utils';

describe('ValidatableSelectField.utils', () => {
    describe('customPortalStyles', () => {
        const base = {
            backgroundColor: '',
            color: '',
            cursor: '',
            padding: '',
            fontFamily: '',
            fontSize: '',
            lineHeight: '',
        } as CSSStyleDeclaration;

        it('should apply default styles when no state is provided', () => {
            const state = { isDisabled: false, isFocused: false, isSelected: false };

            const result = customPortalStyles.option(base, state);

            expect(result).toStrictEqual({
                backgroundColor: '',
                color: '#333',
                cursor: 'pointer',
                padding: '10px 12px',
                fontFamily: 'easyjet_rounded_book, Arial, Helvetica, sans-serif',
                fontSize: '15px',
                lineHeight: '24px',
            });
        });

        it('should apply focused styles when state isFocused is true', () => {
            const state = { isDisabled: false, isFocused: true, isSelected: false };

            const result = customPortalStyles.option(base, state);

            expect(result).toStrictEqual({
                backgroundColor: 'transparent',
                color: '#ff4600',
                cursor: 'pointer',
                padding: '10px 12px',
                fontFamily: 'easyjet_rounded_book, Arial, Helvetica, sans-serif',
                fontSize: '15px',
                lineHeight: '24px',
            });
        });

        it('should apply disabled styles when state isDisabled is true', () => {
            const state = { isDisabled: true, isFocused: false, isSelected: false };

            const result = customPortalStyles.option(base, state);

            expect(result).toStrictEqual({
                backgroundColor: '',
                color: '#a9b9bd',
                cursor: 'default',
                padding: '10px 12px',
                fontFamily: 'easyjet_rounded_book, Arial, Helvetica, sans-serif',
                fontSize: '15px',
                lineHeight: '24px',
            });
        });

        it('should apply selected styles when state isSelected is true', () => {
            const state = { isDisabled: false, isFocused: false, isSelected: true };

            const result = customPortalStyles.option(base, state);

            expect(result).toStrictEqual({
                backgroundColor: '#f1f5f6',
                color: '#ff7d00',
                cursor: 'pointer',
                padding: '10px 12px',
                fontFamily: 'easyjet_rounded_book, Arial, Helvetica, sans-serif',
                fontSize: '15px',
                lineHeight: '24px',
            });
        });

        it('should apply correct styles when state is both focused and selected', () => {
            const state = { isDisabled: false, isFocused: true, isSelected: true };

            const result = customPortalStyles.option(base, state);

            expect(result).toStrictEqual({
                backgroundColor: '#f1f5f6',
                color: '#ff7d00',
                cursor: 'pointer',
                padding: '10px 12px',
                fontFamily: 'easyjet_rounded_book, Arial, Helvetica, sans-serif',
                fontSize: '15px',
                lineHeight: '24px',
            });
        });
    });

    it('should apply default marginTop to menu', () => {
        const result = customPortalStyles.menu({ marginTop: '10px' } as CSSStyleDeclaration);

        expect(result).toStrictEqual({
            backgroundColor: '#fff',
            border: '1px solid #a9b9bd',
            borderRadius: '6px',
            marginTop: '0px',
            zIndex: '10',
        });
    });

    it('should apply default padding to menuList', () => {
        const result = customPortalStyles.menuList({ padding: '5px' } as CSSStyleDeclaration);

        expect(result).toStrictEqual({
            padding: '0px',
        });
    });
});
