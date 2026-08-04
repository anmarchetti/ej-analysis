import React from 'react';
import { render, screen } from '@testing-library/react';

import { createMockStores } from 'frontend/__mocks__';
import { GuestType } from 'models/enum/GuestType';

import { GuestAddressSection } from './GuestAddressSection';

const mockUseState = jest.fn(init => [init, jest.fn()]);

jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useContext: () => mockStores,
    useState: init => mockUseState(init),
}));

const mockValidatableFieldNew = jest.fn();
jest.mock('frontend/components/common/ValidatableField/ValidatableFieldNew', () => ({
    __esModule: true,
    default: props => {
        mockValidatableFieldNew(props);

        return <div data-tid='validatable-field-new' />;
    },
}));

const mockValidatableFieldSearch = jest.fn();
jest.mock('frontend/components/common/ValidatableField/ValidatableFieldSearch', () => ({
    __esModule: true,
    default: props => {
        mockValidatableFieldSearch(props);

        return <div data-tid='validatable-field-search' />;
    },
}));

const mockValidatableSelectField = jest.fn();
jest.mock('frontend/components/common/ValidatableSelectField', () => ({
    __esModule: true,
    default: props => {
        mockValidatableSelectField(props);

        return <div data-tid='validatable-select-field' />;
    },
}));

let mockStores;
let mockProps;

const paramsOnChange = jest.fn();

describe('GuestAddressSection', () => {
    beforeEach(() => {
        mockStores = createMockStores({
            guestDetailsStore: {
                isAddressLookup: true,
                setIsAddressLookup: jest.fn(),
            },
            layoutStore: {
                isAddressLookupEnabled: true,
            },
        });

        mockProps = {
            countryCodesSelectOptions: [{ value: 'GBR', label: 'United Kingdom', iso2: 'GB' }],
            CodesSelectOptions: [],
            forceErrors: false,
            getGuestSrLabel: jest.fn(),
            guestDetails: {
                type: GuestType.Adult,
                email: 'test@example.com',
                isLead: true,
                errors: new Map(),
                dateOfBirthErrors: jest.fn(() => []),
                onChangeField: jest.fn(),
                isLeadLegalAdult: jest.fn(),
                toggleSurnameSameAsLead: jest.fn(),
                getErrorsBySiteName: jest.fn(() => []),
            },
            id: 'id',
            onChange: jest.fn().mockReturnValue(paramsOnChange),
        };
    });

    it('should render ValidatableFieldSearch when isAddressLookup is true', () => {
        render(<GuestAddressSection {...mockProps} />);

        expect(screen.getByTestId('validatable-select-field')).toBeInTheDocument();
        expect(mockValidatableSelectField).toHaveBeenCalledWith({
            disableValidationTraking: true,
            disabled: false,
            errors: [],
            forceError: false,
            id: 'country-ADULT-id',
            label: 'Globals.DestinationTypes.Country',
            onChange: expect.any(Function),
            options: [
                {
                    iso2: 'GB',
                    label: 'United Kingdom',
                    value: 'GBR',
                },
            ],
            portal: true,
            srLabel: undefined,
            value: undefined,
        });
        expect(screen.getByTestId('validatable-field-search')).toBeInTheDocument();
        expect(mockValidatableFieldSearch).toHaveBeenCalledWith({
            errors: [],
            forceError: false,
            id: 'address-ADULT-id',
            label: 'GuestDetails.Labels.Address',
            loadingMessage: expect.any(Function),
            onChange: expect.any(Function),
            onInputChange: expect.any(Function),
            params: {
                iso2: undefined,
                onChange: expect.any(Function),
            },
            placeholder: 'AddressLookup.Labels.Placeholder',
        });

        expect(mockValidatableFieldSearch.mock.calls[0][0].loadingMessage()).toBe('AddressLookup.Labels.Loading');

        expect(screen.queryByTestId('validatable-field-new')).toBeNull();

        const btn = screen.getByText('AddressLookup.Labels.AddAddressManually');
        expect(btn).toBeInTheDocument();

        btn.click();

        expect(mockStores.guestDetailsStore.setIsAddressLookup).toHaveBeenCalledWith(false);
    });

    it('should render manual mode when isAddressLookup is false', () => {
        mockStores.guestDetailsStore.isAddressLookup = false;

        render(<GuestAddressSection {...mockProps} />);

        expect(screen.getByTestId('validatable-select-field')).toBeInTheDocument();
        expect(mockValidatableSelectField).toHaveBeenCalledWith({
            disableValidationTraking: true,
            disabled: false,
            errors: [],
            forceError: false,
            id: 'country-ADULT-id',
            label: 'Globals.DestinationTypes.Country',
            onChange: expect.any(Function),
            options: [
                {
                    iso2: 'GB',
                    label: 'United Kingdom',
                    value: 'GBR',
                },
            ],
            portal: true,
            srLabel: undefined,
            value: undefined,
        });

        expect(screen.queryByTestId('validatable-field-search')).toBeNull();
        expect(screen.getAllByTestId('validatable-field-new')).toHaveLength(4);

        [
            {
                id: 'address-ADULT-id',
                label: 'GuestDetails.Labels.Address',
            },
            {
                id: 'address2-ADULT-id',
                label: 'GuestDetails.Labels.Address2',
            },
            {
                id: 'city-ADULT-id',
                label: 'GuestDetails.Labels.City',
            },
            {
                id: 'postCode-ADULT-id',
                label: 'GuestDetails.Labels.Postcode',
            },
        ].forEach((item, idx) =>
            expect(mockValidatableFieldNew).toHaveBeenNthCalledWith(idx + 1, expect.objectContaining(item)),
        );

        const btn = screen.getByText('AddressLookup.Labels.SearchForAddress');
        expect(btn).toBeInTheDocument();

        btn.click();

        expect(mockStores.guestDetailsStore.setIsAddressLookup).toHaveBeenCalledWith(true);
    });

    it('should render manual mode when isAddressLookupEnabled is false', () => {
        mockStores.layoutStore.isAddressLookupEnabled = false;

        const { container } = render(<GuestAddressSection {...mockProps} />);

        expect(screen.getByTestId('validatable-select-field')).toBeInTheDocument();

        expect(screen.queryByTestId('validatable-field-search')).toBeNull();

        expect(screen.getAllByTestId('validatable-field-new')).toHaveLength(4);

        [
            {
                id: 'address-ADULT-id',
                label: 'GuestDetails.Labels.Address',
            },
            {
                id: 'address2-ADULT-id',
                label: 'GuestDetails.Labels.Address2',
            },
            {
                id: 'city-ADULT-id',
                label: 'GuestDetails.Labels.City',
            },
            {
                id: 'postCode-ADULT-id',
                label: 'GuestDetails.Labels.Postcode',
            },
        ].forEach((item, idx) =>
            expect(mockValidatableFieldNew).toHaveBeenNthCalledWith(idx + 1, expect.objectContaining(item)),
        );

        expect(container.querySelector('.button')).toBeNull();
    });

    it('should call multiple onChange when params.onChange was executed', () => {
        render(<GuestAddressSection {...mockProps} />);

        jest.useFakeTimers();

        mockValidatableFieldSearch.mock.calls[0][0].params.onChange({
            addressLine1: 'str 1',
            addressLine2: 'str 2',
            postcode: '0011',
            townCity: 'city',
        });

        jest.runAllTimers();

        ['address', 'address2', 'city', 'postCode'].forEach((key, i) => {
            expect(mockProps.onChange).toHaveBeenNthCalledWith(i + 1, key);
        });

        ['str 1', 'str 2', 'city', '0011'].forEach((key, i) => {
            expect(paramsOnChange).toHaveBeenNthCalledWith(i + 1, key);
        });

        expect(mockStores.guestDetailsStore.setIsAddressLookup).toHaveBeenCalledWith(false);
    });
});
