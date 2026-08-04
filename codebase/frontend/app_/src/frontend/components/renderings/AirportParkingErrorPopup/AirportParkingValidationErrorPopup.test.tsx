import * as React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { createMockStores } from 'frontend/__mocks__';
import * as isBackend from 'frontend/utils/isBackend';
import { mockSitecoreField } from 'frontend/utils/tests.utils';

import {
    AirportParkingValidationErrorPopup,
    IParkingValidationErrorPopupFields,
    TParkingValidationErrorPopup,
} from './AirportParkingValidationErrorPopup';

const mockIsBackend = isBackend as { default: () => boolean };

jest.mock('frontend/utils/isBackend', () => ({
    __esModule: true,
    default: () => false,
}));

jest.mock('frontend/components/common/Popup', () => ({
    __esModule: true,
    Popup: ({ children }) => <div data-tid='airport-parking-validation-error-popup'>{children}</div>,
}));

jest.mock('frontend/components/common/Button', () => ({
    __esModule: true,
    default: props => <button onClick={props.onClick}>{props.children}</button>,
}));

const createProps = (): TParkingValidationErrorPopup => ({
    fields: {
        ParkingValidationErrorPopupTitle: mockSitecoreField('ParkingValidationErrorPopupTitle'),
        ParkingValidationErrorPopupDescription: mockSitecoreField('ParkingValidationErrorPopupDescription'),
        ParkingValidationErrorPopupBtnText: mockSitecoreField('ParkingValidationErrorPopupBtnText'),
    },
    params: {},
    rendering: {},
});

const createStores = () =>
    createMockStores({
        bookingStore: {
            isAirportParkingValidationError: true,
            setIsAirportParkingValidationError: jest.fn(),
        },
    });

let props = createProps();
let mockStores = createStores();

jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useContext: () => mockStores,
}));

describe('<AirportParkingValidationErrorPopup />', () => {
    beforeEach(() => {
        props = createProps();
        mockStores = createStores();
    });

    it('should NOT render when no fields', () => {
        delete props.fields;
        render(<AirportParkingValidationErrorPopup {...props} />);

        expect(screen.queryByTestId('airport-parking-validation-error-popup')).not.toBeInTheDocument();
    });

    it('should NOT render when backend side', () => {
        mockIsBackend.default = () => true;
        render(<AirportParkingValidationErrorPopup {...props} />);

        expect(screen.queryByTestId('airport-parking-validation-error-popup')).not.toBeInTheDocument();
        mockIsBackend.default = () => false;
    });

    it('should NOT render when isAirportParkingValidationError is false', () => {
        mockStores.bookingStore.isAirportParkingValidationError = false;
        render(<AirportParkingValidationErrorPopup {...props} />);

        expect(screen.queryByTestId('airport-parking-validation-error-popup')).not.toBeInTheDocument();
    });

    it('should render when isAirportParkingValidationError is true', () => {
        render(<AirportParkingValidationErrorPopup {...props} />);
        const {
            ParkingValidationErrorPopupTitle,
            ParkingValidationErrorPopupDescription,
            ParkingValidationErrorPopupBtnText,
        } = props.fields!;

        expect(screen.getByTestId('airport-parking-validation-error-popup')).toBeInTheDocument();
        expect(screen.getByText(ParkingValidationErrorPopupTitle?.value)).toBeInTheDocument();
        expect(screen.getByText(ParkingValidationErrorPopupDescription.value)).toBeInTheDocument();
        expect(screen.getByText(ParkingValidationErrorPopupBtnText.value)).toBeInTheDocument();
    });

    it('should NOT render title when Title field is not defined', () => {
        const fields = props.fields as IParkingValidationErrorPopupFields;
        fields.ParkingValidationErrorPopupTitle = mockSitecoreField('');

        render(<AirportParkingValidationErrorPopup {...props} />);

        expect(screen.queryByTestId('airport-parking-validation-error-title')).not.toBeInTheDocument();
    });

    it('should NOT render description when Description field is not defined', () => {
        const fields = props.fields as IParkingValidationErrorPopupFields;
        fields.ParkingValidationErrorPopupDescription = mockSitecoreField('');

        render(<AirportParkingValidationErrorPopup {...props} />);

        expect(screen.queryByTestId('airport-parking-validation-error-description')).not.toBeInTheDocument();
    });

    it('should NOT render button when ParkingValidationErrorPopupBtnText field is not defined', () => {
        const fields = props.fields as IParkingValidationErrorPopupFields;
        fields.ParkingValidationErrorPopupBtnText = mockSitecoreField('');

        render(<AirportParkingValidationErrorPopup {...props} />);

        expect(screen.queryByTestId('airport-parking-validation-error-button')).not.toBeInTheDocument();
    });

    it('should call setIsAirportParkingValidationError when accept-button is clicked', async () => {
        render(<AirportParkingValidationErrorPopup {...props} />);
        const acceptBtn = screen.getByRole('button', {
            name: props.fields?.ParkingValidationErrorPopupBtnText.value,
        });

        const { setIsAirportParkingValidationError } = mockStores.bookingStore;

        await userEvent.click(acceptBtn);

        expect(setIsAirportParkingValidationError).toHaveBeenCalled();
    });
});
