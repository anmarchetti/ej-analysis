import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';

import Checkbox from './Checkbox';

jest.mock('frontend/components/icons-new/Tick', () => ({
    __esModule: true,
    default: () => <svg data-tid='icon-svg-tick' />,
}));

jest.mock('./RichTextWithLinks', () => ({
    __esModule: true,
    default: ({ field }) => <div data-tid='richtext-with-links'>{field.value}</div>,
}));

describe('<Checkbox />', () => {
    const resetMocks = () => ({
        children: null,

        render: undefined,
        label: '',
        checked: false,
        disabled: false,
        enableIfChecked: false,
        disabledShowUnchecked: false,

        small: false,
        textLeft: false,
        textBold: false,
        textBig: false,
        medium: false,

        large: false,
        textRight: false,
        tick: false,
        isRadioStyle: false,
        dataTid: 'test-tid',
        onChange: jest.fn(),
        isMultipleSelect: false,
        ariaLabel: 'ariaLabel',
    });

    let mocks;

    beforeEach(() => {
        mocks = resetMocks();
    });

    describe('Checkbox should called func from props', () => {
        it('Should called func from props', () => {
            render(<Checkbox {...mocks} />);

            fireEvent.click(screen.getByRole('checkbox'));

            expect(mocks.onChange).toHaveBeenCalled();
        });
    });

    describe('Checkbox should render with params from props', () => {
        it('Should render checked input and tick icon', () => {
            mocks.checked = true;
            mocks.tick = true;
            render(<Checkbox {...mocks} />);

            expect(screen.getByRole('checkbox')).toBeChecked();
            expect(screen.getByTestId('icon-svg-tick')).toBeInTheDocument();
        });

        it('Should render disabled input', () => {
            mocks.disabled = true;
            render(<Checkbox {...mocks} />);

            expect(screen.getByRole('checkbox')).toBeDisabled();
        });

        it('Should render control and label with error className when hasError enabled', () => {
            mocks.hasError = true;
            const { container } = render(<Checkbox {...mocks} />);

            expect(container.querySelector('.checkbox__control--error')).toBeInTheDocument();
            expect(container.querySelector('.checkbox--text-error')).toBeInTheDocument();
        });

        it('Should render checked input', () => {
            mocks.disabledShowUnchecked = true;
            mocks.checked = true;
            render(<Checkbox {...mocks} />);

            expect(screen.getByRole('checkbox')).toBeChecked();
        });

        it('Should render disabled input', () => {
            mocks.enableIfChecked = true;
            mocks.disabled = true;
            render(<Checkbox {...mocks} />);

            expect(screen.getByRole('checkbox')).toBeDisabled();
        });

        it('Should render with RichText', () => {
            mocks.render = jest.fn();
            mocks.label = { value: 'label' };
            render(<Checkbox {...mocks} />);

            expect(mocks.render).toBeCalled();
            expect(screen.getByTestId('richtext-with-links')).toHaveTextContent(mocks.label.value);
        });

        it('Should render children', () => {
            const testChild = 'test';
            mocks.children = testChild;
            render(<Checkbox {...mocks} />);

            expect(screen.getByText(testChild)).toBeInTheDocument();
        });
    });

    describe('Checkbox should render className', () => {
        it('Should render className checkbox--small', () => {
            mocks.small = true;
            render(<Checkbox {...mocks} />);

            expect(screen.getByTestId(mocks.dataTid)).toHaveClass('checkbox checkbox--small');
        });

        it('Should render className checkbox--text-left', () => {
            mocks.textLeft = true;
            render(<Checkbox {...mocks} />);

            expect(screen.getByTestId(mocks.dataTid)).toHaveClass('checkbox checkbox--text-left');
        });

        it('Should render className checkbox--text-bold', () => {
            mocks.textBold = true;
            render(<Checkbox {...mocks} />);

            expect(screen.getByTestId(mocks.dataTid)).toHaveClass('checkbox checkbox--text-bold');
        });

        it('Should render className checkbox--text-big', () => {
            mocks.textBig = true;
            render(<Checkbox {...mocks} />);

            expect(screen.getByTestId(mocks.dataTid)).toHaveClass('checkbox checkbox--text-big');
        });

        it('Should render className checkbox--large', () => {
            mocks.large = true;
            render(<Checkbox {...mocks} />);

            expect(screen.getByTestId(mocks.dataTid)).toHaveClass('checkbox checkbox--large');
        });

        it('Should render className checkbox--medium', () => {
            mocks.medium = true;
            render(<Checkbox {...mocks} />);

            expect(screen.getByTestId(mocks.dataTid)).toHaveClass('checkbox checkbox--medium');
        });

        it('Should render className checkbox--text-right', () => {
            mocks.textRight = true;
            render(<Checkbox {...mocks} />);

            expect(screen.getByTestId(mocks.dataTid)).toHaveClass('checkbox checkbox--text-right');
        });

        it('Should render className checkbox--tick', () => {
            mocks.tick = true;
            render(<Checkbox {...mocks} />);

            expect(screen.getByTestId(mocks.dataTid)).toHaveClass('checkbox checkbox--tick');
        });

        it('Should render className checkbox--medium', () => {
            mocks.medium = true;
            render(<Checkbox {...mocks} />);

            expect(screen.getByTestId(mocks.dataTid)).toHaveClass('checkbox checkbox--medium');
        });

        it('Should render className checkbox--disabled', () => {
            mocks.disabled = true;
            render(<Checkbox {...mocks} />);

            expect(screen.getByTestId(mocks.dataTid)).toHaveClass('checkbox checkbox--disabled');
        });

        it('Should render className checkbox--radio', () => {
            mocks.isRadioStyle = true;
            render(<Checkbox {...mocks} />);

            expect(screen.getByTestId(mocks.dataTid)).toHaveClass('checkbox checkbox--radio');
        });

        it('Should render className checkbox--multiple', () => {
            mocks.isMultipleSelect = true;
            render(<Checkbox {...mocks} />);

            expect(screen.getByTestId(mocks.dataTid)).toHaveClass('checkbox--multiple');
        });

        it('Should render className checkbox--text-orange', () => {
            mocks.isMultipleSelect = true;
            mocks.checked = true;
            const { container } = render(<Checkbox {...mocks} />);

            expect(container.querySelector('.checkbox--text-orange')).toBeInTheDocument();
        });

        it('Should render className checkbox--right-aligned', () => {
            mocks.rightAlign = true;
            const { container } = render(<Checkbox {...mocks} />);

            expect(container.querySelector('.checkbox--right-aligned')).toBeInTheDocument();
        });

        it('should render with same for/id/name', () => {
            const id = 'checkbox-id';
            mocks.id = id;

            const { container } = render(<Checkbox {...mocks} />);

            expect(container.querySelector(`label[for=${id}]`)).toBeInTheDocument();
            expect(container.querySelector(`#${id}`)).toBeInTheDocument();
            expect(container.querySelector(`[name=${id}]`)).toBeInTheDocument();
        });
    });

    it('should render label with ariaLabel', () => {
        const ariaLabel = 'aria-label-test';
        mocks.label = 'Test Label';
        mocks.ariaLabel = ariaLabel;

        render(<Checkbox {...mocks} />);

        const ariaLabelElement = screen.getByText(ariaLabel);

        expect(ariaLabelElement).toBeInTheDocument();
        expect(ariaLabelElement).toHaveClass('visually-hidden');
    });
});
