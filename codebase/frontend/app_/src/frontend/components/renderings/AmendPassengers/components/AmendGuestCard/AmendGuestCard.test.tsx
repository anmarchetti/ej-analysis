import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';

import { mockGuests as guests } from 'frontend/__mocks__/guests';
import validationService from 'frontend/services/validation.service';
import * as AmendPassengersUtils from 'frontend/utils/AmendPassengers.utils';
import { mockSitecoreField } from 'frontend/utils/tests.utils';
import { GuestToEdit } from 'models/data/GuestToEdit';
import { ApiErrors } from 'models/enum/ApiErrors';
import { GuestType } from 'models/enum/GuestType';
import { AmendGuestCard } from 'frontend/components/renderings/AmendPassengers/components/AmendGuestCard/AmendGuestCard';

const createStores = () => ({
    layoutStore: { getPhrase: jest.fn(v => v) },
    amendPassengerStore: {
        guestsToEdit: guests.map(guest => new GuestToEdit(guest, '123')),
        isLoadingPassengers: false,
        amendPassengerNameCharacterCount: 3,
        booking: {
            bookingReference: '12345',
        },
    },
    appStore: { isScreenMedium: true },
    trackingStore: { trackValidation: jest.fn() },
    routerStore: {
        redirectTo: jest.fn(),
    },
    tracking: {
        clickToEditPassenger: jest.fn(),
        onSavePassengerDetails: jest.fn(),
        onShowExceedCharactersCountError: jest.fn(),
        onCommitPassengersNameChangeError: jest.fn(),
    },
});

const getProps = () => ({
    guestToEdit: {
        ...mockStores.amendPassengerStore.guestsToEdit[0],
        init: jest.fn(),
    },
    fields: {
        EditPassengerDetailsCTA: { value: 'EditPassengerDetailsCTA' },
        AgedLabel: { value: 'AgedLabel' },
        CharacterLimitRestriction: { value: 'CharacterLimitRestriction' },
        ChangeLimitRestriction: { value: 'ChangeLimitRestriction' },
        LeadPassengerRestriction: { value: 'LeadPassengerRestriction' },
        ErrorPopupTitle: { value: 'Generic Error' },
        ErrorPopupSubtext: { value: 'Generic Error Description' },
        CharacterCountExceededWarning: { value: 'Exceeded by {count}' },
        CharacterCountWarning: { value: '{count} remaining' },
        CharacterCountExceededAdvice: { value: 'CharacterCountExceededAdvice {number}' },
        Phone: { value: '012345' },
        NameChangeTitle: mockSitecoreField('NameChangeTitle'),
    },
});

let mockStores;
let mockProps;

jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useContext: () => mockStores,
}));

jest.mock('frontend/components/common/Drawer', () => ({
    __esModule: true,
    default: () => <div>Drawer</div>,
}));

jest.mock('../AmendGuestCardFooter/AmendGuestCardFooter', () => ({
    __esModule: true,
    default: ({ onRemovePassenger, onCloseCard }) => (
        <div>
            <p>AmendGuestCardFooter</p>
            <button onClick={onCloseCard}>AmendGuestCardFooterClose</button>
            <button onClick={onRemovePassenger}>remove passenger btn</button>
        </div>
    ),
}));

jest.mock('frontend/services/validation.service');

describe('<AmendGuestCard />', () => {
    beforeEach(() => {
        jest.resetAllMocks();
        mockStores = createStores();
        mockProps = getProps();

        // Mock window.scrollTo as <AmendGuestPopup /> uses it
        Object.defineProperty(window, 'scrollTo', {
            value: jest.fn(),
            writable: true,
        });
        (validationService.validateField as jest.MockedFn<any>).mockReturnValue([]);

        const mockXHR = {
            open: jest.fn(),
            send: jest.fn(),
            setRequestHeader: jest.fn(),
            readyState: 4,
            status: 200,
            responseText: JSON.stringify({}),
            onreadystatechange: null,
        };

        (global.XMLHttpRequest as any) = jest.fn(() => mockXHR);

        (global.fetch as any) = jest.fn(() =>
            Promise.resolve({
                json: () => Promise.resolve({}),
                text: () => Promise.resolve(''),
                ok: true,
            }),
        );
    });

    afterEach(() => {
        jest.clearAllTimers();
        jest.restoreAllMocks();
        delete (global as any).scrollTo;
    });

    it('Should render', () => {
        const { getByTestId } = render(<AmendGuestCard {...mockProps} />);
        expect(getByTestId('guest-card')).toBeInTheDocument();
    });

    it('Should have only new name if not changed name', () => {
        const { queryByTestId } = render(<AmendGuestCard {...mockProps} />);
        expect(queryByTestId('guest-old-name')).not.toBeInTheDocument();
        expect(queryByTestId('guest-new-name')).toHaveTextContent('Mrs Ann Brown');
    });

    it('Should not render <AmendGuestPopup /> if not changed name', () => {
        const { queryByTestId } = render(<AmendGuestCard {...mockProps} />);
        expect(queryByTestId('amend-guests-popup')).not.toBeInTheDocument();
    });

    it('Should NOT render <AmendGuestPopup /> if change lead passenger is clicked', () => {
        mockProps.guestToEdit.initialDetails.isLead = true;
        render(<AmendGuestCard {...mockProps} />);
        screen.getByTestId('edit-passenger').click();
        expect(screen.queryByTestId('amend-guests-popup')).not.toBeInTheDocument();
    });

    it('Should not render <AmendGuestPopup /> if edit passenger is clicked and is not lead passenger', () => {
        mockProps.guestToEdit.initialDetails.isLead = false;
        render(<AmendGuestCard {...mockProps} />);
        screen.queryByTestId('edit-passenger')?.click();
        expect(screen.queryByTestId('amend-guests-popup')).not.toBeInTheDocument();
    });

    it('Should render Amend details form if change details is clicked and passenger is not lead', () => {
        mockProps.guestToEdit.openCard = jest.fn();
        render(<AmendGuestCard {...mockProps} />);
        screen.getByTestId('edit-passenger').click();

        expect(mockProps.guestToEdit.openCard).toHaveBeenCalledTimes(1);
    });

    it('Should render <AmendGuestPopup /> if change details is clicked and Remove passenger is clicked', () => {
        mockProps.guestToEdit.isSelected = true;
        render(<AmendGuestCard {...mockProps} />);
        fireEvent.click(screen.getByText('remove passenger btn'));

        expect(screen.getByTestId('amend-guests-popup')).toBeInTheDocument();
    });

    it('Should tracking "edit" event be fired', () => {
        render(<AmendGuestCard {...mockProps} />);
        screen.getByTestId('edit-passenger').click();
        expect(mockStores.tracking.clickToEditPassenger).toHaveBeenCalledWith('12345');
    });

    it('Should render form', () => {
        mockProps.guestToEdit.isSelected = true;
        render(<AmendGuestCard {...mockProps} />);

        expect(screen.getByTestId('amend-passenger-card-title')).toBeInTheDocument();
        expect(screen.getByTestId('amend-details-form')).toBeInTheDocument();
    });

    it('Should tracking "save passenger" event be fired', () => {
        mockProps.guestToEdit.isSelected = true;
        render(<AmendGuestCard {...mockProps} />);

        fireEvent.submit(screen.getByTestId('amend-details-form'));

        expect(mockStores.tracking.onSavePassengerDetails).toHaveBeenCalledWith('12345', 3);
    });

    it('Should NOT render AmendPopup by click', () => {
        mockProps.guestToEdit.initialDetails.isLead = true;
        mockStores.appStore.isScreenMedium = false;
        const { queryByTestId, getByText } = render(<AmendGuestCard {...mockProps} />);

        const button = getByText('EditPassengerDetailsCTA');
        fireEvent.click(button);

        expect(queryByTestId('amend-guests-popup')).not.toBeInTheDocument();
    });

    it('Should render AmendPopup for Infant', () => {
        mockProps.guestToEdit.initialDetails.type = GuestType.Infant;
        mockProps.guestToEdit.isSelected = true;
        mockStores.appStore.isScreenMedium = true;
        const { getByText, getByTestId } = render(<AmendGuestCard {...mockProps} />);

        const button = getByText('remove passenger btn');
        fireEvent.click(button);

        expect(getByTestId('amend-guests-popup')).toBeTruthy();
    });

    it('Should render "CharacterLimitRestriction" error', () => {
        mockProps.guestToEdit.error = {
            errorCode: ApiErrors.CharactersChangeLimitExeeded,
        };
        const { getByText } = render(<AmendGuestCard {...mockProps} />);

        const button = getByText('EditPassengerDetailsCTA');
        fireEvent.click(button);

        expect(getByText('CharacterLimitRestriction')).toBeTruthy();
    });

    it('Should render "ChangeLimitRestriction" error', () => {
        mockProps.guestToEdit.error = {
            errorCode: ApiErrors.ChangeLimitExeeded,
        };
        const { getByText } = render(<AmendGuestCard {...mockProps} />);

        const button = getByText('EditPassengerDetailsCTA');
        fireEvent.click(button);

        expect(getByText('ChangeLimitRestriction')).toBeTruthy();
    });

    it('Handle close popup', () => {
        window.scrollTo = jest.fn();
        mockProps.guestToEdit.error = {
            errorCode: ApiErrors.ChangeLimitExeeded,
        };

        const { getByText, queryByTestId } = render(<AmendGuestCard {...mockProps} />);

        const button = getByText('EditPassengerDetailsCTA');
        fireEvent.click(button);

        const closeBtn = getByText('Globals.Buttons.Close');
        fireEvent.click(closeBtn);

        expect(queryByTestId('amend-guests-popup')).not.toBeInTheDocument();
    });

    it('Should render previous name', () => {
        mockProps.guestToEdit.isEdited = true;
        mockProps.guestToEdit.isSelected = false;
        const { getByTestId } = render(<AmendGuestCard {...mockProps} />);

        expect(getByTestId('guest-old-name')).toBeTruthy();
    });

    it('Should render all fields for adult', () => {
        mockProps.guestToEdit.isSelected = true;
        const { getByTestId } = render(<AmendGuestCard {...mockProps} />);

        expect(getByTestId(`title-${guests[0].type}-${guests[0].index}`)).toBeInTheDocument();
        expect(getByTestId(`first-name-${guests[0].type}-${guests[0].index}`)).toBeInTheDocument();
        expect(getByTestId(`surname-${guests[0].type}-${guests[0].index}`)).toBeInTheDocument();
        expect(getByTestId(`age-${guests[0].type}-${guests[0].index}`)).toBeInTheDocument();
    });

    it('Should render specificjest fields for infant', () => {
        mockProps.guestToEdit = mockStores.amendPassengerStore.guestsToEdit[2];
        mockProps.guestToEdit.isSelected = true;
        const { getByTestId } = render(<AmendGuestCard {...mockProps} />);

        expect(() => getByTestId(`title-${guests[2].type}-${guests[2].index}`)).toThrow();
        expect(getByTestId(`first-name-${guests[2].type}-${guests[2].index}`)).toBeInTheDocument();
        expect(getByTestId(`surname-${guests[2].type}-${guests[2].index}`)).toBeInTheDocument();
        expect(() => getByTestId(`age-${guests[2].type}-${guests[2].index}`)).toThrow();
    });

    it('Should render generic ErrorPopup', () => {
        mockProps.guestToEdit.error = {
            errorCode: 'Generic',
        };
        const { getByTestId, getByText } = render(<AmendGuestCard {...mockProps} />);

        expect(getByTestId('amend-guests-popup')).toBeTruthy();
        expect(getByText('Generic Error')).toBeTruthy();
        expect(getByText('Generic Error Description')).toBeTruthy();
    });

    it('Should render character change validation', () => {
        mockProps.guestToEdit.isEdited = true;
        mockProps.guestToEdit.isSelected = true;

        render(<AmendGuestCard {...mockProps} />);

        expect(screen.getByTestId('character-change-warning')).toBeInTheDocument();
        expect(screen.getByText('3 remaining')).toBeInTheDocument();
    });

    it('Should show characters count exceeded warning', async () => {
        mockProps.guestToEdit.isEdited = true;
        mockProps.guestToEdit.isSelected = true;
        mockProps.guestToEdit.tempName = 'Annabcde';

        render(<AmendGuestCard {...mockProps} />);

        screen.getByLabelText(`${guests[0].firstName} GuestDetails.Labels.FirstName`).focus();
        screen.getByLabelText(`${guests[0].firstName} GuestDetails.Labels.LastName`).focus();

        await waitFor(() => {
            expect(screen.getByText('Exceeded by 2')).toBeInTheDocument();
            expect(screen.getByText('CharacterCountExceededAdvice')).toBeInTheDocument();
            expect(screen.getByText('012345')).toBeInTheDocument();
        });
    });

    it('should render disabled button if canChangeName is false', () => {
        mockProps.guestToEdit.canChangeName = false;
        render(<AmendGuestCard {...mockProps} />);

        const button = screen.getByTestId('edit-passenger');
        expect(button).toHaveAttribute('disabled');
        fireEvent.click(button);
        expect(screen.queryByTestId('amend-guests-popup')).not.toBeInTheDocument();
        expect(screen.queryByTestId('amend-details-form')).not.toBeInTheDocument();
    });

    it('should render placeholder shimmer button if isLoadingPassengers is true', () => {
        mockStores.amendPassengerStore.isLoadingPassengers = true;
        render(<AmendGuestCard {...mockProps} />);

        const button = screen.getByTestId('edit-passenger');
        expect(button).toHaveClass('placeholder-shimmer');
    });

    it('calls right callbacks after card close', async () => {
        mockProps.guestToEdit.isSelected = true;

        const updateRemainingCharactersToChangeSpy = jest.spyOn(
            AmendPassengersUtils,
            'updateRemainingCharactersToChange',
        );
        const onCloseSpy = jest.spyOn(mockProps.guestToEdit, 'closeCard');

        const { getByText } = render(<AmendGuestCard {...mockProps} />);

        const closeBtn = getByText('AmendGuestCardFooterClose');

        fireEvent.click(closeBtn);

        expect(updateRemainingCharactersToChangeSpy).toHaveBeenCalled();
        expect(onCloseSpy).toHaveBeenCalled();
    });

    it('Should render exceed length error for name and surname', async () => {
        mockProps.guestToEdit.isEdited = true;
        mockProps.guestToEdit.isSelected = true;
        (validationService.validateField as jest.MockedFn<any>).mockImplementation((entity, name) => [
            {
                errorMessage: 'GuestDetails.ErrorMessages.FirstNameExceededLength',
                propertyName: name,
                rawErrorMessage: '',
                rule: 'maxLength',
                trigger: 'OnType',
            },
            {
                errorMessage: 'GuestDetails.ErrorMessages.FirstNameInvalidCharacters',
                propertyName: name,
                rawErrorMessage: '',
                rule: 'pattern',
                trigger: 'OnType',
            },
        ]);

        render(<AmendGuestCard {...mockProps} />);

        screen.getByLabelText(`${guests[0].firstName} GuestDetails.Labels.FirstName`).focus();
        screen.getByLabelText(`${guests[0].firstName} GuestDetails.Labels.LastName`).focus();

        await waitFor(() => {
            expect(screen.getByTestId('first-name-ADULT-1')).toHaveTextContent(
                'GuestDetails.ErrorMessages.FirstNameExceededLength',
            );
            expect(screen.getByTestId('surname-ADULT-1')).toHaveTextContent(
                'GuestDetails.ErrorMessages.FirstNameExceededLength',
            );
        });
    });
});
