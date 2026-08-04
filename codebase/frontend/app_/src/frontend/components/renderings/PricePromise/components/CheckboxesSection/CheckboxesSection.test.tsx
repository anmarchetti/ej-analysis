import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';

import { createMockStores } from 'frontend/__mocks__';
import { PricePromiseInfoFields } from 'models/data/PricePromiseInfo';
import SitecoreDictionary from 'models/enum/SitecoreDictionary';
import { mockPricePromiseFields } from 'frontend/components/renderings/PricePromise/__mocks__/pricePromiseFields.mock';
import { mockPricePromiseStore } from 'frontend/components/renderings/PricePromise/__mocks__/pricePromiseStore.mock';

import CheckboxesSection, { TCheckboxesSectionProps } from './CheckboxesSection';

const createProps = (): TCheckboxesSectionProps => ({
    fields: mockPricePromiseFields,
    store: mockPricePromiseStore,
});

let mockProps = createProps();

const mockText = jest.fn();
jest.mock('@sitecore-jss/sitecore-jss-nextjs', () => ({
    __esModule: true,
    Text: props => {
        mockText(props);

        return <div data-tid='sitecore-jss-text' />;
    },
}));

const mockCheckboxProps = jest.fn();
jest.mock('frontend/components/common/Checkbox', () => props => {
    mockCheckboxProps(props);

    return (
        <div data-tid='checkbox'>
            <input onChange={props.onChange} type='checkbox' />
            {props.children}
        </div>
    );
});

const mockRichTextWithLinksProps = jest.fn();
jest.mock('frontend/components/common/RichTextWithLinks', () => props => {
    mockRichTextWithLinksProps(props);

    return <div data-tid='rich-text-with-links' />;
});

const mockErrorMessageProps = jest.fn();
jest.mock('frontend/components/common/ErrorMessage', () => props => {
    mockErrorMessageProps(props);

    return <div data-tid='error-message' />;
});

const mockGetCheckBoxes = [
    {
        checkbox: PricePromiseInfoFields.DifferentCompanyCheckbox,
        label: mockPricePromiseFields.DifferentCompanyLabel.value,
    },
    {
        checkbox: PricePromiseInfoFields.SameDatesOfTravelCheckbox,
        label: mockPricePromiseFields.SameDatesOfTravelLabel.value,
    },
    {
        checkbox: PricePromiseInfoFields.SameFlightsCheckbox,
        label: mockPricePromiseFields.SameFlightsLabel.value,
    },
];
jest.mock('frontend/components/renderings/PricePromise/pricePromise.utils', () => ({
    getFieldLabel: jest.fn(f => f),
    isFieldRequired: jest.fn(() => true),
    getCheckBoxes: jest.fn(() => mockGetCheckBoxes),
}));

let mockStores = createMockStores();

jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useContext: () => mockStores,
}));

describe('<CheckboxesSection />', () => {
    beforeEach(() => {
        mockProps = createProps();
        mockStores = createMockStores();
    });

    it('should render section title and description', () => {
        render(<CheckboxesSection {...mockProps} />);

        expect(screen.getByTestId('sitecore-jss-text')).toBeInTheDocument();
        expect(mockText).toHaveBeenCalledWith({
            className: 'sectionTitle',
            tag: 'h3',
            field: mockProps.fields.CheckboxSectionTitle,
        });

        expect(screen.getByTestId('rich-text-with-links')).toBeInTheDocument();
        expect(mockRichTextWithLinksProps).toHaveBeenCalledWith({
            field: mockProps.fields.CheckboxSectionDescription,
            className: 'text',
        });
    });

    it('should render checkboxes', () => {
        render(<CheckboxesSection {...mockProps} />);

        expect(screen.getAllByTestId('checkbox')).toHaveLength(mockGetCheckBoxes.length);

        mockGetCheckBoxes.forEach(({ checkbox, label }) => {
            expect(mockCheckboxProps).toHaveBeenCalledWith({
                onChange: expect.any(Function),
                checked: mockProps.store.pricePromiseInfo[checkbox],
                label: label,
                hasError: false,
                small: true,
                tick: true,
                textRight: true,
                className: 'checkbox',
            });
        });
    });

    it('should show error message when forceErrors is true and checkbox set is invalid', () => {
        mockProps.store.forceErrors = true;
        Object.defineProperty(mockProps.store.pricePromiseInfo, 'isValidCheckboxSet', {
            get: jest.fn().mockReturnValue(false),
        });
        mockProps.store.pricePromiseInfo.isValidField = jest.fn(() => false);

        render(<CheckboxesSection {...mockProps} />);

        expect(screen.getByTestId('error-message')).toBeInTheDocument();
        expect(mockErrorMessageProps).toHaveBeenCalledWith({
            message: SitecoreDictionary.PricePromiseErrorsCheckboxesRequired,
            errorMessageClass: 'checkboxError error',
            IsDesc: true,
            icon: expect.anything(),
        });
    });

    it('should NOT render checkbox if label is empty', () => {
        mockGetCheckBoxes[0].label = '';
        render(<CheckboxesSection {...mockProps} />);

        expect(screen.getAllByTestId('checkbox')).toHaveLength(2);
    });

    it('should call onChangeField when checkbox changes', () => {
        render(<CheckboxesSection {...mockProps} />);

        const checkbox = screen.getAllByRole('checkbox')[0];
        fireEvent.click(checkbox);

        expect(mockProps.store.pricePromiseInfo.onChangeField).toHaveBeenCalledWith(
            PricePromiseInfoFields.SameDatesOfTravelCheckbox,
            true,
        );
    });
});
