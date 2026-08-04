import * as React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { createMockStores } from 'frontend/__mocks__';
import * as isBackend from 'frontend/utils/isBackend';
import { mockSitecoreField } from 'frontend/utils/tests.utils';

import {
    AirportParkingNotAvailablePopup,
    IAirportParkingNotAvailablePopupFields,
    TAirportParkingNotAvailablePopup,
} from './AirportParkingNotAvailablePopup';

const mockIsBackend = isBackend as { default: () => boolean };

jest.mock('frontend/utils/isBackend', () => ({
    __esModule: true,
    default: () => false,
}));

jest.mock('frontend/components/common/Popup', () => ({
    __esModule: true,
    Popup: ({ children }) => <div data-tid='parking-not-available-popup'>{children}</div>,
}));

jest.mock('frontend/components/common/Button', () => ({
    __esModule: true,
    default: props => <button onClick={props.onClick}>{props.children}</button>,
}));

const createProps = (): TAirportParkingNotAvailablePopup => ({
    fields: {
        ParkingNotAvailablePopupTitle: mockSitecoreField('ParkingNotAvailablePopupTitle'),
        ParkingNotAvailablePopupDescription: mockSitecoreField('ParkingNotAvailablePopupDescription'),
        ParkingNotAvailablePopupClearBtnText: mockSitecoreField('ParkingNotAvailablePopupClearBtnText'),
    },
    params: {},
    rendering: {},
});

const createStores = () =>
    createMockStores({
        airportParkingStore: {
            isSelectedParkingUnavailableError: true,
            clearSelectedAirportParkingAndUpdateUrl: jest.fn(),
            setIsSelectedParkingUnavailableError: jest.fn(),
        },
        bookingStore: {
            fetchOfferAndReloadPage: jest.fn(),
        },
        paymentStore: {
            selectDefaultPaymentOption: jest.fn(),
        },
    });

let props = createProps();
let mockStores = createStores();

jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useContext: () => mockStores,
}));
jest.mock('frontend/hooks/useReCaptcha');

describe('<AirportParkingNotAvailablePopup />', () => {
    beforeEach(() => {
        props = createProps();
        mockStores = createStores();
    });

    it('should NOT render when no fields', () => {
        delete props.fields;
        render(<AirportParkingNotAvailablePopup {...props} />);

        expect(screen.queryByTestId('parking-not-available-popup')).not.toBeInTheDocument();
    });

    it('should NOT render when backend side', () => {
        mockIsBackend.default = () => true;
        render(<AirportParkingNotAvailablePopup {...props} />);

        expect(screen.queryByTestId('parking-not-available-popup')).not.toBeInTheDocument();
        mockIsBackend.default = () => false;
    });

    it('should NOT render when isSelectedParkingUnavailableError is false', () => {
        mockStores.airportParkingStore.isSelectedParkingUnavailableError = false;
        render(<AirportParkingNotAvailablePopup {...props} />);

        expect(screen.queryByTestId('parking-not-available-popup')).not.toBeInTheDocument();
    });

    it('should render when isSelectedParkingUnavailableError is true', () => {
        render(<AirportParkingNotAvailablePopup {...props} />);
        const {
            ParkingNotAvailablePopupTitle,
            ParkingNotAvailablePopupDescription,
            ParkingNotAvailablePopupClearBtnText,
        } = props.fields!;

        expect(screen.getByTestId('parking-not-available-popup')).toBeInTheDocument();
        expect(screen.getByText(ParkingNotAvailablePopupTitle?.value)).toBeInTheDocument();
        expect(screen.getByText(ParkingNotAvailablePopupDescription.value)).toBeInTheDocument();
        expect(screen.getByText(ParkingNotAvailablePopupClearBtnText.value)).toBeInTheDocument();
    });

    it('should NOT render title when Title field is not defined', () => {
        const fields = props.fields as IAirportParkingNotAvailablePopupFields;
        fields.ParkingNotAvailablePopupTitle = mockSitecoreField('');

        render(<AirportParkingNotAvailablePopup {...props} />);

        expect(screen.queryByTestId('parking-not-available-title')).not.toBeInTheDocument();
    });

    it('should NOT render description when Description field is not defined', () => {
        const fields = props.fields as IAirportParkingNotAvailablePopupFields;
        fields.ParkingNotAvailablePopupDescription = mockSitecoreField('');

        render(<AirportParkingNotAvailablePopup {...props} />);

        expect(screen.queryByTestId('parking-not-available-description')).not.toBeInTheDocument();
    });

    it('should NOT render button when ParkingNotAvailablePopupClearBtnText field is not defined', () => {
        const fields = props.fields as IAirportParkingNotAvailablePopupFields;
        fields.ParkingNotAvailablePopupClearBtnText = mockSitecoreField('');

        render(<AirportParkingNotAvailablePopup {...props} />);

        expect(screen.queryByTestId('add-parking-later-button')).not.toBeInTheDocument();
    });

    it('should clear and reload page when add-parking-later-button is clicked', async () => {
        render(<AirportParkingNotAvailablePopup {...props} />);
        const removeParkingBtn = screen.getByRole('button', {
            name: props.fields?.ParkingNotAvailablePopupClearBtnText.value,
        });

        const { setIsSelectedParkingUnavailableError, clearSelectedAirportParkingAndUpdateUrl } =
            mockStores.airportParkingStore;

        await userEvent.click(removeParkingBtn);

        expect(clearSelectedAirportParkingAndUpdateUrl).toHaveBeenCalled();
        expect(setIsSelectedParkingUnavailableError).toHaveBeenCalled();
        expect(mockStores.bookingStore.fetchOfferAndReloadPage).toHaveBeenCalled();
        expect(mockStores.paymentStore.selectDefaultPaymentOption).toHaveBeenCalled();
    });
});
