import { act } from 'react';
import { renderHook } from '@testing-library/react';

import { createMockStores } from 'frontend/__mocks__';
import { IValidationError } from 'models/data/validation/IValidationError';

import useValidatableField, { IUseValidatableFieldProps } from './ValidatableFieldNew.utils';

jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useContext: () => mockStores,
}));

let mockStores;
let mockProps: IUseValidatableFieldProps;

describe('ValidatableFieldNew.utils', () => {
    beforeEach(() => {
        mockStores = createMockStores();
        mockProps = {
            errors: [],
            value: 'test',
            disabled: false,
            onChange: jest.fn(),
            hideError: false,
            submitted: false,
        };
    });

    describe('useValidatableField', () => {
        it('should trim value and updates state when value changes', () => {
            const { result } = renderHook(() => useValidatableField({ ...mockProps, value: '  test  ' }));

            act(() => {
                result.current.onBlur();
            });

            expect(mockProps.onChange).toHaveBeenCalledWith('test');
            expect(result.current.state).toStrictEqual({
                touched: true,
                blurred: true,
                focused: false,
            });
        });

        it('should NOT call onChange if value is unchanged after trimming', () => {
            const { result } = renderHook(() => useValidatableField(mockProps));

            act(() => {
                result.current.onBlur();
            });

            expect(mockProps.onChange).not.toHaveBeenCalled();
            expect(result.current.state).toEqual({
                touched: true,
                blurred: true,
                focused: false,
            });
        });

        it('should update state to focused', () => {
            const { result } = renderHook(() =>
                useValidatableField({
                    ...mockProps,
                    value: '',
                }),
            );

            act(() => {
                result.current.onFocus({} as React.FocusEvent<HTMLInputElement>);
            });

            expect(result.current.state).toStrictEqual({
                touched: true,
                blurred: false,
                focused: true,
            });
        });

        it('should render validIcon when there are no errors and value is valid', () => {
            const { result } = renderHook(() => useValidatableField(mockProps));

            expect(result.current.validIcon).not.toBeNull();
        });

        it('should NOT render validIcon when there are errors', () => {
            const { result } = renderHook(() =>
                useValidatableField({
                    ...mockProps,
                    errors: [{ errorMessage: 'Error' }] as IValidationError[],
                }),
            );

            expect(result.current.validIcon).toBeNull();
        });

        it('should NOT render validIcon when value is empty', () => {
            const { result } = renderHook(() =>
                useValidatableField({
                    ...mockProps,
                    value: '',
                }),
            );

            expect(result.current.validIcon).toBeNull();
        });

        it('should set hasError to true when there are errors and field is touched but not focused', () => {
            const { result } = renderHook(() =>
                useValidatableField({
                    ...mockProps,
                    errors: [{ errorMessage: 'Error' }] as IValidationError[],
                    value: '',
                }),
            );

            act(() => {
                result.current.onBlur();
            });

            expect(result.current.hasError).toBe(true);
        });

        it('should set hasError to true when there are errors and submitted is true', () => {
            const { result } = renderHook(() =>
                useValidatableField({
                    ...mockProps,
                    errors: [{ errorMessage: 'Error' }] as IValidationError[],
                    value: '',
                    submitted: true,
                }),
            );

            expect(result.current.hasError).toBe(true);
        });

        it('should set isErrorShown to false when hideError is true', () => {
            const { result } = renderHook(() =>
                useValidatableField({
                    ...mockProps,
                    errors: [{ errorMessage: 'Error' }] as IValidationError[],
                    value: '',
                    hideError: true,
                }),
            );

            act(() => {
                result.current.onBlur();
            });

            expect(result.current.isErrorShown).toBe(false);
        });

        it('should set hasError to true when there are validation errors', () => {
            const { result } = renderHook(() =>
                useValidatableField({
                    ...mockProps,
                    errors: [{ errorMessage: 'Error' }] as IValidationError[],
                }),
            );

            act(() => {
                result.current.onFocus({} as React.FocusEvent<HTMLInputElement>);
                result.current.onBlur();
            });

            expect(result.current.hasError).toBe(true);
        });

        it('should set hasError to false when there are no validation errors', () => {
            const { result } = renderHook(() => useValidatableField(mockProps));

            expect(result.current.hasError).toBe(false);
        });

        it('should set isErrorShown to true when there are errors and hideError is false', () => {
            const { result } = renderHook(() =>
                useValidatableField({
                    ...mockProps,
                    errors: [{ errorMessage: 'Error' }] as IValidationError[],
                    hideError: false,
                    submitted: true,
                }),
            );

            expect(result.current.isErrorShown).toBe(true);
        });

        it('should set isErrorShown to false when hideError is true', () => {
            const { result } = renderHook(() =>
                useValidatableField({
                    ...mockProps,
                    errors: [{ errorMessage: 'Error', trigger: 'onType' }] as unknown as IValidationError[],
                    hideError: true,
                }),
            );

            expect(result.current.isErrorShown).toBe(false);
        });

        it('should set isErrorShown to false when there are no errors', () => {
            const { result } = renderHook(() => useValidatableField(mockProps));

            expect(result.current.isErrorShown).toBe(false);
        });

        it('should call blurTransform on blur', () => {
            const blurTransform = jest.fn();

            const { result } = renderHook(() =>
                useValidatableField({ ...mockProps, value: '07123456789', blurTransform }),
            );

            act(() => {
                result.current.onBlur();
            });

            expect(blurTransform).toHaveBeenCalledWith('07123456789');
        });
    });
});
