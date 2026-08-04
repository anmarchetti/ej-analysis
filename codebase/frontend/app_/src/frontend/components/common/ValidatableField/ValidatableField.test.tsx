import * as React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';

import { ValidationType } from 'models/enum/ValidationType';

import { ValidatableField } from './ValidatableField';

jest.mock('frontend/utils/ui.utils');

import { moveInputCursor } from 'frontend/utils/ui.utils';

const mockMoveInputCursor = moveInputCursor as jest.Mock;

jest.mock('frontend/utils/event.utils', () => ({
    focusNextElementOnEnter: jest.fn(),
}));

const resetMocks = () => ({
    label: 'test',
    onChange: jest.fn(),
    id: 'test',
    errors: [],
    value: 'test',
    trackValidation: jest.fn(),
    getPhrase: jest.fn(() => 'test-content'),
});

const errors = [
    { errorMessage: 'test error message', trigger: ValidationType.OnBlur, propertyName: 'test property name' },
    { errorMessage: 'test-2', trigger: ValidationType.OnType, propertyName: 'test-2' },
];

let props;

describe('<ValidatableField />', () => {
    beforeEach(() => {
        props = resetMocks();
    });

    it.skip('should render component correctly at set touched and blurred fields', async () => {
        props.errors = errors;
        props.getPhrase = jest.fn((s: string) => s);

        render(<ValidatableField {...(props as any)} />);

        const input = screen.getByRole('textbox');

        fireEvent.focus(input);
        await waitFor(() => {
            expect(screen.getByText('test-2')).toBeInTheDocument();
        });

        fireEvent.blur(input);
        await waitFor(() => {
            expect(screen.getByText('test error message')).toBeInTheDocument();
        });
    });

    it.skip('should correctly show first error messages', () => {
        props.errors = errors;

        render(<ValidatableField {...(props as any)} />);

        const input = screen.getByRole('textbox');
        fireEvent.focus(input);
        fireEvent.blur(input);

        expect(screen.getByText('test-content')).toBeInTheDocument();
        expect(props.getPhrase).toHaveBeenCalledWith('test error message');
    });

    it('should correctly track first error', () => {
        props.errors = errors;
        (props as any).forceError = true;

        render(<ValidatableField {...(props as any)} />);

        const input = screen.getByRole('textbox');
        fireEvent.focus(input);
        fireEvent.blur(input);

        expect(props.trackValidation).toHaveBeenCalledWith('test property name', 'test error message');
    });

    it('should NOT track first error when disableValidationTraking is true', () => {
        props.errors = errors;
        (props as any).forceError = true;
        (props as any).disableValidationTraking = true;

        render(<ValidatableField {...(props as any)} />);

        const input = screen.getByRole('textbox');
        fireEvent.focus(input);
        fireEvent.blur(input);

        expect(props.trackValidation).not.toHaveBeenCalled();
    });

    it('should NOT track first error when hideErrorDetails is true', () => {
        props.errors = errors;
        (props as any).forceError = true;
        (props as any).hideErrorDetails = true;

        render(<ValidatableField {...(props as any)} />);

        const input = screen.getByRole('textbox');
        fireEvent.focus(input);
        fireEvent.blur(input);

        expect(props.trackValidation).not.toHaveBeenCalled();
    });

    it('should be valid and show icon if no errors found and there is value', () => {
        render(<ValidatableField {...(props as any)} />);

        const input = screen.getByRole('textbox');
        fireEvent.focus(input);
        fireEvent.blur(input);

        expect(document.querySelector('.form-control__icon')).toBeTruthy();
        expect(screen.queryByTestId('validatable-field-error')).not.toBeInTheDocument();
    });

    it('should be invalid (no tick) when value is null', () => {
        props.value = null as any;

        render(<ValidatableField {...(props as any)} />);

        expect(document.querySelector('.form-control__icon')).toBeFalsy();
    });

    it('should be invalid (no tick) when trimmed value is empty string and shouldTrimOnBlur is true', () => {
        props.value = '   ' as any;
        (props as any).shouldTrimOnBlur = true;

        render(<ValidatableField {...(props as any)} />);

        expect(document.querySelector('.form-control__icon')).toBeFalsy();
    });

    it.skip('should move input cursor correctly when shouldMoveCursor is true (calls moveInputCursor with start-1)', () => {
        (props as any).shouldMoveCursor = true;

        const { rerender } = render(<ValidatableField {...(props as any)} />);

        const input = screen.getByRole('textbox');

        fireEvent.focus(input);
        fireEvent.change(input, { target: { value: 'test', selectionStart: 2 } });

        rerender(<ValidatableField {...({ ...props, value: 'tes t' } as any)} />);

        expect(mockMoveInputCursor).toHaveBeenCalled();
        expect((mockMoveInputCursor as jest.Mock).mock.calls[0][1]).toBe(1);
    });

    it('should call onChange on user typing', () => {
        render(<ValidatableField {...(props as any)} />);

        const input = screen.getByRole('textbox');
        fireEvent.focus(input);
        fireEvent.blur(input);
        fireEvent.change(input, { target: { value: 'test1' } });

        expect(props.onChange).toHaveBeenCalledWith('test1');
    });

    it('should trim on blur when shouldTrimOnBlur is true and value had spaces', () => {
        (props as any).shouldTrimOnBlur = true;
        props.value = 'test  ' as any;

        render(<ValidatableField {...(props as any)} />);

        fireEvent.blur(screen.getByRole('textbox'));
        expect(props.onChange).toHaveBeenCalledWith('test');
    });

    it('should NOT call onChange on blur when trim enabled but nothing to trim', () => {
        (props as any).shouldTrimOnBlur = true;
        props.value = 'test';

        render(<ValidatableField {...(props as any)} />);

        fireEvent.blur(screen.getByRole('textbox'));
        expect(props.onChange).not.toHaveBeenCalled();
    });

    it('should NOT trim on blur when shouldTrimOnBlur is false', () => {
        (props as any).shouldTrimOnBlur = false;
        props.value = 'test  ';

        render(<ValidatableField {...(props as any)} />);

        fireEvent.blur(screen.getByRole('textbox'));
        expect(props.onChange).not.toHaveBeenCalled();
    });
});
