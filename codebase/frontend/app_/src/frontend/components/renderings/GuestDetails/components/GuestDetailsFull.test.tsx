import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react'; // Importing render and fireEvent from '@testing-library/react'

import { smoothScrollIntoView } from 'frontend/utils/ui.utils';
import { GuestType } from 'models/enum/GuestType';
import { ValidationType } from 'models/enum/ValidationType';
import { GuestInfo } from 'models/GuestInfo';

import { GuestDetailsFull } from './GuestDetailsFull';

const errors = [
    { errorMessage: 'test error message', trigger: ValidationType.OnBlur, propertyName: 'test property name' },
    { errorMessage: 'test-2 error message', trigger: ValidationType.OnType, propertyName: 'test-2 property name' },
];

const createStores = () => ({
    layoutStore: { getPhrase: jest.fn(), getSetting: jest.fn() },
    guestDetailsStore: {
        leadSurname: 'leadSurname',
        isFormValid: false,
        confirmPolicy: false,
        getPrimarySectionText: jest.fn(),
        getSecondarySectionText: jest.fn(),
        adults: [] as GuestInfo[],
        children: [] as GuestInfo[],
        infants: [] as GuestInfo[],
        customerLogin: {
            onChangeEmail: jest.fn(),
            cleanUpErrors: jest.fn(),
            email: 'email',
            emailErrors: [],
            errors: [],
            firstError: true,
        } as any,
        toggleGuestDetailsPhase: jest.fn(),
        initializeGuestsInfoPage: jest.fn(),
        onSelectContinue: jest.fn(),
        toggleForceErrors: jest.fn(),
        formErrors: [{}],
        setIsAddressLookup: jest.fn(),
        isAddressLookup: false,
    },
    appCatalogStore: {
        countryCodesSelectOptions: [],
        dialingCodesSelectOptions: [],
        getCustomerTitlesSelectOptions: jest.fn(() => []),
    },
    bookingStore: { selectedOffer: null },
    trackingStore: { trackValidation: jest.fn() },
    userStore: { isLoggedIn: false },
});

let mocks;
let mockStores = createStores();

jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useContext: () => mockStores,
}));

jest.mock('frontend/utils/ui.utils', () => ({
    __esModule: true,
    smoothScrollIntoView: jest.fn(),
}));

const mockGuestSectionComponent = jest.fn();

jest.mock('./GuestSection', () => ({
    __esModule: true,
    default: props => {
        mockGuestSectionComponent(props);

        return <div data-tid='guest-section' />;
    },
}));

const mockElement = {
    querySelector: jest.fn().mockReturnValue({
        click: jest.fn(),
    }),
    dataset: { status: 'collapsed' },
} as unknown as HTMLDivElement;

const getElementsByClassNameSpy = jest
    .spyOn(document, 'getElementsByClassName')
    .mockReturnValue([mockElement] as unknown as HTMLCollectionOf<HTMLElement>);

describe('<GuestDetails />', () => {
    beforeEach(() => {
        mocks = {
            fields: {},
        };
        mockStores = createStores();
    });

    it('should call initializeGuestsInfoPage on init', () => {
        render(<GuestDetailsFull {...mocks} />);

        expect(mockStores.guestDetailsStore.initializeGuestsInfoPage).toBeCalled();
    });

    it('should scroll into errors if form not valid', async () => {
        render(<GuestDetailsFull {...mocks} />);

        jest.useFakeTimers();

        await fireEvent.click(screen.getByTestId('continue-button'));

        jest.runAllTimers();

        expect(mockStores.guestDetailsStore.onSelectContinue).not.toBeCalled();
        expect(smoothScrollIntoView).toHaveBeenCalledWith(expect.any(Object), {
            duration: 500,
            block: 'center',
        });
        expect(mockStores.guestDetailsStore.toggleForceErrors).toBeCalled();
    });

    it('should not call onSelectContinue if form is valid', async () => {
        mockStores.guestDetailsStore.isFormValid = true;
        mockStores.guestDetailsStore.confirmPolicy = true;
        mockStores.guestDetailsStore.customerLogin.firstError = true;

        render(<GuestDetailsFull {...mocks} />);

        await fireEvent.click(screen.getByTestId('continue-button'));

        expect(smoothScrollIntoView).not.toHaveBeenCalled();
        expect(mockStores.guestDetailsStore.toggleForceErrors).not.toBeCalled();
    });

    it('should correctly track errors on continue when they exist', async () => {
        mockStores.guestDetailsStore.formErrors = errors;
        mockStores.guestDetailsStore.onSelectContinue = jest.fn().mockRejectedValue(true);

        render(<GuestDetailsFull {...mocks} />);

        await fireEvent.click(screen.getByTestId('continue-button'));

        expect(mockStores.trackingStore.trackValidation).toBeCalledWith('test property name', 'test error message');
        expect(mockStores.trackingStore.trackValidation).toBeCalledWith('test-2 property name', 'test-2 error message');
    });

    it('should handle errors from onSelectContinue correctly', async () => {
        mockStores.guestDetailsStore.isFormValid = true;
        mockStores.guestDetailsStore.confirmPolicy = true;
        mockStores.layoutStore.getPhrase = jest.fn(() => 'error');

        try {
            render(<GuestDetailsFull {...mocks} />);
            await fireEvent.click(screen.getByTestId('continue-button'));
        } catch (e) {
            expect(smoothScrollIntoView).toHaveBeenCalledWith(expect.any(Object), {
                duration: 500,
                block: 'center',
            });
            expect(mockStores.layoutStore.getPhrase).toBeCalled();
            expect(mockStores.guestDetailsStore.toggleForceErrors).toBeCalled();
        }
    });

    it('should call onSelectContinue and scroll into errors on continue', async () => {
        mockStores.guestDetailsStore.isFormValid = true;
        mockStores.guestDetailsStore.confirmPolicy = true;
        mockStores.guestDetailsStore.onSelectContinue = jest.fn().mockRejectedValue(true);

        render(<GuestDetailsFull {...mocks} />);

        fireEvent.click(screen.getByTestId('continue-button'));

        // Wait for all potential asynchronous behaviors to complete
        await waitFor(() => {
            expect(mockStores.guestDetailsStore.toggleForceErrors).toHaveBeenCalled();
            expect(smoothScrollIntoView).toHaveBeenCalledWith(expect.any(Object), {
                duration: 500,
                block: 'center',
            });
        });
    });

    it('should NOT scroll into errors when there is no errors', async () => {
        mockStores.guestDetailsStore.isFormValid = false;
        getElementsByClassNameSpy
            .mockReturnValueOnce([] as unknown as HTMLCollectionOf<HTMLElement>)
            .mockReturnValueOnce([] as unknown as HTMLCollectionOf<HTMLElement>);

        render(<GuestDetailsFull {...mocks} />);

        fireEvent.click(screen.getByTestId('continue-button'));

        // Wait for all potential asynchronous behaviors to complete
        await waitFor(() => {
            expect(smoothScrollIntoView).not.toHaveBeenCalled();
        });
    });

    it('Should render sections correct', () => {
        mockStores.guestDetailsStore.adults = [{ type: GuestType.Adult, firstName: 'Adult' }] as GuestInfo[];
        mockStores.guestDetailsStore.children = [{ type: GuestType.Child, firstName: 'Child' }] as GuestInfo[];
        mockStores.guestDetailsStore.infants = [{ type: GuestType.Infant, firstName: 'Infant' }] as GuestInfo[];

        render(<GuestDetailsFull {...mocks} />);

        expect(mockGuestSectionComponent).toBeCalled();
        expect(screen.getAllByTestId('guest-section')).toHaveLength(3);
    });
});
