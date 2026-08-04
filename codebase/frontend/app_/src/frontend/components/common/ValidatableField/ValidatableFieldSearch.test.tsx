import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';

import { createMockStores } from 'frontend/__mocks__';
import SitecoreDictionary from 'models/enum/SitecoreDictionary';

import ValidatableFieldSearch, { COMPONENTS, NoOptionsMessage } from './ValidatableFieldSearch';

jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useContext: () => mockStores,
}));

const mockValidatableSelectField = jest.fn();
jest.mock('frontend/components/common/ValidatableSelectField', () => ({
    __esModule: true,
    default: props => {
        mockValidatableSelectField(props);

        return <div data-tid='validatable-select-field' />;
    },
}));

let mockProps;
let mockStores;

describe('ValidatableFieldSearch', () => {
    beforeEach(() => {
        mockProps = {
            id: 'field-id',
            label: 'Field Label',
            placeholder: 'Enter value',
            errors: [],
            onChange: jest.fn(() => Promise.resolve()),
            onInputChange: jest.fn(() => Promise.resolve()),
            params: {
                data: 'params',
            },
        };
        mockStores = createMockStores();
    });

    it('should render', () => {
        render(<ValidatableFieldSearch {...mockProps} />);

        expect(mockValidatableSelectField).toHaveBeenCalledWith({
            Components: {
                ClearIndicator: expect.any(Function),
                DropdownIndicator: null,
                NoOptionsMessage: expect.any(Function),
            },
            disableValidationTraking: true,
            disabled: false,
            errors: [],
            filterOption: null,
            forceError: undefined,
            id: 'field-id',
            inputValue: '',
            isClearable: true,
            isLoading: false,
            isSearchable: true,
            label: 'Enter value',
            loadingMessage: undefined,
            onChange: expect.any(Function),
            onInputChange: expect.any(Function),
            options: [],
            portal: true,
        });

        expect(screen.getByTestId('validatable-select-field')).toBeInTheDocument();
    });

    it('should call onChange when option is provided', () => {
        render(<ValidatableFieldSearch {...mockProps} />);

        mockValidatableSelectField.mock.calls[0][0].onChange('value', { id: 'id' });

        expect(mockProps.onChange).toHaveBeenCalledWith({ id: 'id' }, { data: 'params' });
    });

    it('should NOT call onChange when option is NOT provided', () => {
        render(<ValidatableFieldSearch {...mockProps} />);

        mockValidatableSelectField.mock.calls[0][0].onChange('value', null);

        expect(mockProps.onChange).not.toHaveBeenCalled();
    });

    it('should call onInputChange when query is provided', () => {
        render(<ValidatableFieldSearch {...mockProps} />);

        ['input-change', 'clear', 'set-value', 'invalid'].forEach((action, idx) => {
            mockValidatableSelectField.mock.calls[0][0].onInputChange('va', { action });

            if (action === 'invalid') {
                expect(mockProps.onInputChange).not.toHaveBeenCalledTimes(idx + 1);
            } else {
                expect(mockProps.onInputChange).toHaveBeenNthCalledWith(idx + 1, 'va', { data: 'params' });
            }
        });
    });

    it('should NOT call onInputChange when query is empty', () => {
        render(<ValidatableFieldSearch {...mockProps} />);

        mockValidatableSelectField.mock.calls[0][0].onInputChange('', { action: 'input-change' });

        expect(mockProps.onInputChange).not.toHaveBeenCalled();
    });
});

describe('<NoOptionsMessage />', () => {
    it('should display no results message when input is provided and options are empty', () => {
        render(<NoOptionsMessage selectProps={{ inputValue: 'query' }} options={[]} />);

        expect(screen.getByText(SitecoreDictionary.AddressLookupLabelsNoResultsFound)).toBeInTheDocument();
    });

    it('should display default no options message when input is empty', () => {
        render(<NoOptionsMessage selectProps={{ inputValue: '' }} options={[]} />);

        expect(screen.getByText(SitecoreDictionary.AddressLookupLabelsNoOptions)).toBeInTheDocument();
    });

    it('should display default no options message when options are not empty', () => {
        render(<NoOptionsMessage selectProps={{ inputValue: '' }} options={[{ value: '1', label: 'Option 1' }]} />);

        expect(screen.getByText(SitecoreDictionary.AddressLookupLabelsNoOptions)).toBeInTheDocument();
    });
});

describe('COMPONENTS', () => {
    it('should call onInputChange with empty string and clear action when inputValue is not empty', () => {
        const mockProps = {
            selectProps: {
                inputValue: 'some value',
                onInputChange: jest.fn(),
            },
            getStyles: jest.fn(),
            cx: jest.fn(),
        };

        render(<COMPONENTS.ClearIndicator {...mockProps} />);

        fireEvent.mouseDown(screen.getByRole('button'));

        expect(mockProps.selectProps.onInputChange).toHaveBeenCalledWith('', { action: 'clear' });
    });

    it('should not call onInputChange when inputValue is empty', () => {
        const mockProps = {
            selectProps: {
                inputValue: '',
                onInputChange: jest.fn(),
            },
            getStyles: jest.fn(),
            cx: jest.fn(),
        };

        render(<COMPONENTS.ClearIndicator {...mockProps} />);

        fireEvent.mouseDown(screen.getByRole('button'));

        expect(mockProps.selectProps.onInputChange).not.toHaveBeenCalled();
    });
});
