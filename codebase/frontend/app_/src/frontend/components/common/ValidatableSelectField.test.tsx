import * as React from 'react';
import Select from 'react-select';
import { fireEvent, render, screen } from '@testing-library/react';

import SitecoreDictionary from 'models/enum/SitecoreDictionary';
import { ValidationType } from 'models/enum/ValidationType';

import { ValidatableSelectField } from './ValidatableSelectField';

let mockLastSelectProps: any = null;
jest.mock('react-select', () => {
    const Select = (props: any) => {
        mockLastSelectProps = props;

        return (
            <div data-testid='select-root' className={props.className}>
                <input role='textbox' onFocus={props.onFocus} onBlur={props.onBlur} aria-label={props['aria-label']} />
                <button data-tid='change-null' onClick={() => props.onChange(null)} />
                <button data-tid='change-value' onClick={() => props.onChange({ value: 'test1', label: 'test1' })} />
            </div>
        );
    };
    (Select as any).__getLastProps = () => mockLastSelectProps;

    return Select;
});

const getSelectProps = () => (Select as any).__getLastProps();

const resetMocks = () => ({
    label: 'label',
    srLabel: '',
    onChange: jest.fn(),
    id: 'id',
    errors: [] as any,

    value: '',
    multiValue: [1, 2],
    disabled: false,
    hasGroup: false,
    fieldClass: '',
    isVertical: false,
    forceError: false,
    options: [] as any,
    trackValidation: jest.fn(),
    getPhrase: jest.fn(n => n),
    isClearable: true,
    inputValue: '',
});

const errors = [
    {
        errorMessage: 'test error message',
        rawErrorMessage: 'test error message raw',
        trigger: ValidationType.OnBlur,
        propertyName: 'test property name',
    },
    {
        errorMessage: 'test',
        rawErrorMessage: 'test error message raw 2',
        trigger: ValidationType.OnType,
        propertyName: 'test1',
    },
];

let mocks;

describe('<ValidatableSelectField />', () => {
    beforeEach(() => {
        mocks = resetMocks();
    });

    it('should NOT show errors after focus/blur', () => {
        render(<ValidatableSelectField {...mocks} />);

        const input = screen.getByRole('textbox');

        fireEvent.focus(input);
        fireEvent.blur(input);

        const errorCalls = mocks.getPhrase.mock.calls.filter(
            call => call[0] !== SitecoreDictionary.AccessibilityAriaLabelsComboboxNoOptionSelected,
        );

        expect(errorCalls.length).toBe(0);
    });

    // TODO fix to RTL
    // it('should correctly show first error messages if no errors found', () => {
    //     const component = shallow(<ValidatableSelectField {...mocks} />);

    //     component.find(Select).simulate('focus');
    //     component.find(Select).simulate('blur');

    //     expect((component.instance() as any).firstError).toEqual('');
    // });

    it('should correctly show error messages from getPhrase', () => {
        mocks.forceError = true;
        mocks.errors = errors;
        mocks.getPhrase = jest.fn(() => 'error');

        const { container } = render(<ValidatableSelectField {...mocks} />);

        const input = screen.getByRole('textbox');

        fireEvent.focus(input);
        fireEvent.blur(input);

        const errorLabel = container.querySelector('.form-control__error__label');

        expect(errorLabel).toBeInTheDocument();
        expect(errorLabel).toHaveTextContent('error');

        expect(mocks.trackValidation).toHaveBeenCalled();
        expect(mocks.getPhrase).toHaveBeenCalled();
    });

    it('should track only first error on blur', () => {
        mocks.errors = errors;
        mocks.forceError = true;

        render(<ValidatableSelectField {...mocks} />);

        const input = screen.getByRole('textbox');

        fireEvent.focus(input);
        fireEvent.blur(input);

        expect(mocks.trackValidation).toHaveBeenCalledWith('test property name', 'test error message');
    });

    it('should NOT track first error when disableValidationTraking is true', () => {
        mocks.errors = errors;
        mocks.forceError = true;
        (mocks as any).disableValidationTraking = true;

        render(<ValidatableSelectField {...mocks} />);

        const input = screen.getByRole('textbox');

        fireEvent.focus(input);
        fireEvent.blur(input);

        expect(mocks.trackValidation).not.toHaveBeenCalled();
    });

    it('should use raw error when group booking', () => {
        mocks.errors = errors;
        (mocks as any).isGroupBooking = true;

        render(<ValidatableSelectField {...mocks} />);

        const input = screen.getByRole('textbox');

        fireEvent.focus(input);
        fireEvent.blur(input);

        const errorCalls = mocks.getPhrase.mock.calls.filter(
            call => call[0] !== SitecoreDictionary.AccessibilityAriaLabelsComboboxNoOptionSelected,
        );

        expect(errorCalls.length).toBe(0);
    });

    // TODO fix to RTL
    // it('should call onChange with value', () => {
    //     render(<ValidatableSelectField {...mocks} />);

    //     fireEvent.click(screen.getByTestId('change-value'));

    //     component.find(Select).simulate('focus');
    //     component.find(Select).simulate('blur');

    //     expect((component.instance() as any).firstError).toEqual('test error message raw');
    //     expect(mocks.trackValidation).toBeCalled();
    // });

    it('should call onChange with empty value when null', () => {
        render(<ValidatableSelectField {...mocks} />);

        fireEvent.click(screen.getByTestId('change-null'));

        expect(mocks.onChange).toHaveBeenCalledWith('', null);
    });

    it('should render group wrapper when hasGroup = true', () => {
        mocks.hasGroup = true;

        const { container } = render(<ValidatableSelectField {...mocks} />);

        expect(container.querySelector('.form-group')).toBeTruthy();
    });

    it('should pass isMulti=true when multi select', () => {
        (mocks as any).isMultiSelect = true;

        render(<ValidatableSelectField {...mocks} />);

        expect(getSelectProps().isMulti).toBe(true);
    });

    it('should NOT pass isMulti when single select', () => {
        render(<ValidatableSelectField {...mocks} />);

        expect(getSelectProps().isMulti).toBe(undefined);
    });

    it('should have defaultValue for multi select uses multiValue', () => {
        (mocks as any).isMultiSelect = true;

        render(<ValidatableSelectField {...mocks} />);

        expect(getSelectProps().defaultValue).toStrictEqual([1, 2]);
    });

    it('should have defaultValue for multi select is [] when multiValue is null', () => {
        (mocks as any).isMultiSelect = true;
        (mocks as any).multiValue = null;

        render(<ValidatableSelectField {...mocks} />);

        expect(getSelectProps().defaultValue).toStrictEqual([]);
    });

    it('should have defaultValue for single select uses value when present', () => {
        mocks.value = 'testing';

        render(<ValidatableSelectField {...mocks} />);

        expect(getSelectProps().defaultValue).toBe('testing');
    });

    it('should return empty array when onInputChange provided', () => {
        mocks.onInputChange = jest.fn();

        render(<ValidatableSelectField {...mocks} />);

        expect(getSelectProps().value).toStrictEqual([]);
    });

    it('should return fake option when both onInputChange/inputValue provided', () => {
        mocks.onInputChange = jest.fn();
        mocks.inputValue = 'v';

        render(<ValidatableSelectField {...mocks} />);

        expect(getSelectProps().value).toStrictEqual([{ label: '', value: '' }]);
    });

    it('should have isClearable true by default (single)', () => {
        render(<ValidatableSelectField {...mocks} />);

        expect(getSelectProps().isClearable).toBe(true);
    });

    it('should have isClearable false when prop is false (single)', () => {
        mocks.isClearable = false;

        render(<ValidatableSelectField {...mocks} />);

        expect(getSelectProps().isClearable).toBe(false);
    });

    it('should have isClearable forced true for multi select', () => {
        (mocks as any).isMultiSelect = true;

        render(<ValidatableSelectField {...mocks} />);

        expect(getSelectProps().isClearable).toBe(true);
    });

    it('should use normal components for single select', () => {
        render(<ValidatableSelectField {...mocks} />);

        const comps = getSelectProps().components;

        expect(Object.keys(comps).sort()).toEqual(['DropdownIndicator', 'ValueContainer'].sort());
    });

    it('should use multi components for multi select', () => {
        (mocks as any).isMultiSelect = true;

        render(<ValidatableSelectField {...mocks} />);

        const comps = getSelectProps().components;

        expect(Object.keys(comps).sort()).toEqual(
            [
                'ClearIndicator',
                'DropdownIndicator',
                'MultiValueContainer',
                'MultiValueLabel',
                'MultiValueRemove',
                'Option',
                'ValueContainer',
            ].sort(),
        );
    });

    it('should blurInputOnSelect true for single select', () => {
        render(<ValidatableSelectField {...mocks} />);

        expect(getSelectProps().blurInputOnSelect).toBe(true);
    });

    it('should NOT blurInputOnSelect for multi select', () => {
        (mocks as any).isMultiSelect = true;

        render(<ValidatableSelectField {...mocks} />);

        expect(getSelectProps().blurInputOnSelect).toBe(false);
    });

    it('should closeMenuOnSelect true for single select', () => {
        render(<ValidatableSelectField {...mocks} />);

        expect(getSelectProps().closeMenuOnSelect).toBe(true);
    });

    it('should NOT closeMenuOnSelect for multi select', () => {
        (mocks as any).isMultiSelect = true;

        render(<ValidatableSelectField {...mocks} />);

        expect(getSelectProps().closeMenuOnSelect).toBe(false);
    });

    it('should set value for multi select equals multiValue', () => {
        (mocks as any).isMultiSelect = true;

        render(<ValidatableSelectField {...mocks} />);

        expect(getSelectProps().value).toBe(mocks.multiValue);
    });

    it('should render note when provided', () => {
        mocks.note = <div>note</div>;
        render(<ValidatableSelectField {...mocks} />);

        expect(screen.getByText('note')).toBeInTheDocument();
    });

    it('should NOT render note when absent', () => {
        render(<ValidatableSelectField {...mocks} />);

        expect(screen.queryByText('note')).not.toBeInTheDocument();
    });

    describe('Screen reader label for selected options', () => {
        it('should have correct label for single select', () => {
            mocks.isMultiSelect = true;
            mocks.multiValue = ['value1'];

            render(<ValidatableSelectField {...mocks} />);
            expect(screen.getByTestId('screen-reader-label')).toHaveTextContent(
                SitecoreDictionary.AccessibilityAriaLabelsComboboxSelectedValue,
            );
        });

        it('should have correct label for multi select', () => {
            mocks.isMultiSelect = true;
            mocks.multiValue = ['value1', 'value2'];

            render(<ValidatableSelectField {...mocks} />);
            expect(screen.getByTestId('screen-reader-label')).toHaveTextContent(
                SitecoreDictionary.AccessibilityAriaLabelsComboboxSelectedValues,
            );
        });

        it('should have correct label when no option is selected', () => {
            render(<ValidatableSelectField {...mocks} />);

            expect(screen.getByTestId('screen-reader-label')).toHaveTextContent(
                SitecoreDictionary.AccessibilityAriaLabelsComboboxNoOptionSelected,
            );
        });
    });
});
