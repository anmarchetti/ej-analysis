import * as React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { createMockStores } from 'frontend/__mocks__';
import SitecoreDictionary from 'models/enum/SitecoreDictionary';
import ValidatableTextarea, {
    IValidatableTextareaProps,
} from 'frontend/components/common/ValidatableTextarea/ValidatableTextarea';

const createStores = () =>
    createMockStores({
        layoutStore: {
            isTradePortal: false,
        },
        trackingStore: {
            trackValidation: jest.fn(),
        },
    });

const createProps = (): IValidatableTextareaProps => ({
    label: 'test',
    onChange: jest.fn(),
    id: 'test',
    errors: [],
    value: 'test',
    maxCharacters: 10,
});

let mockStores = createStores();

jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useContext: () => mockStores,
}));

describe('<ValidatableTextarea />', () => {
    let props: IValidatableTextareaProps;

    beforeEach(() => {
        props = createProps();
        mockStores = createStores();
    });

    it('should call onChange function', async () => {
        render(<ValidatableTextarea {...props} />);

        const input = screen.getByLabelText('test') as HTMLTextAreaElement;

        await userEvent.click(input);
        await userEvent.tab();

        fireEvent.change(input, { target: { value: 'test1' } });

        expect(props.onChange).toHaveBeenCalledWith('test1');
    });

    it('should not call onChange if trim is enabled, but nothing was trimmed', async () => {
        props.shouldTrimOnBlur = true;
        props.value = 'test';

        render(<ValidatableTextarea {...props} />);

        const input = screen.getByLabelText('test');

        await userEvent.click(input);
        await userEvent.tab();

        expect(props.onChange).not.toHaveBeenCalled();
    });

    it('should not call onChange if trim is disabled on blur', async () => {
        props.shouldTrimOnBlur = false;
        props.value = 'test  ';

        render(<ValidatableTextarea {...props} />);

        const input = screen.getByLabelText('test');
        await userEvent.click(input);
        await userEvent.tab();

        expect(props.onChange).not.toHaveBeenCalled();
    });

    it('should call onChange with trimmed value when inputFilter removes leading/trailing spaces', () => {
        props.value = '';
        props.inputFilter = /^\s+|\s+$/g;

        render(<ValidatableTextarea {...props} />);

        const input = screen.getByLabelText('test');

        fireEvent.change(input, { target: { value: '  test  ' } });

        expect(props.onChange).toHaveBeenCalledWith('test');
    });

    it('should render placeholder message when placeholder provided and focus', async () => {
        props.placeholder = 'placeholder';

        render(<ValidatableTextarea {...props} />);

        const input = screen.getByLabelText('test') as HTMLTextAreaElement;

        expect(input).toHaveAttribute('placeholder', '');

        await userEvent.click(input);

        expect(input).toHaveAttribute('placeholder', 'placeholder');
    });

    it('should render charactersRemainingLabel', () => {
        render(<ValidatableTextarea {...props} />);

        expect(screen.getByText(SitecoreDictionary.GlobalsFormFieldsTextAreaCharactersRemaining)).toBeInTheDocument();
    });
});
