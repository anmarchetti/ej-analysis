import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe, toHaveNoViolations } from 'jest-axe';

import { createMockStores, mockBooking } from 'frontend/__mocks__';
import { mockSitecoreField } from 'frontend/utils/tests.utils';
import { AmendmentType } from 'models/data/IBookingInfo';
import SitecoreDictionary from 'models/enum/SitecoreDictionary';
import SuccessfulAmendmentPopup from 'frontend/components/renderings/SuccessfulAmendmentPopup/SuccessfulAmendmentPopup';

expect.extend(toHaveNoViolations);

let mockStore;

jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useContext: () => mockStore,
}));

const mockPopupProps = jest.fn();
jest.mock('frontend/components/common/Popup', () => ({
    __esModule: true,
    Popup: ({ children, ...props }) => {
        mockPopupProps(props);

        return <div data-tid='popup'>{children}</div>;
    },
}));

const mockButtonProps = jest.fn();
jest.mock('frontend/components/common/Button', () => ({
    __esModule: true,
    default: ({ children, ...props }) => {
        mockButtonProps(props);

        return <button {...props}>{children}</button>;
    },
}));

jest.mock('frontend/components/renderings/SuccessfulAmendmentPopup/components/SuccessfulAmendmentPopup.utils', () => ({
    __esModule: true,
    getPopupSubtitle: jest.fn((fields, transferName, amendmentStatus) => fields[amendmentStatus + 'Subtitle']),
    getPopupContent: jest.fn(() => <div data-tid='popup-content' />),
}));

jest.mock('frontend/components/common/RichTextWithLinks', () => ({
    __esModule: true,
    default: ({ field }) => <div>{field?.value}</div>,
}));

const fields = {
    FlightTitle: mockSitecoreField('Flight Title'),
    FlightSubtitle: mockSitecoreField('Flight Subtitle'),
    Description: mockSitecoreField('Description {email}'),
    SeatsSubtitle: mockSitecoreField('Seats Subtitle'),
    SeatsTitle: mockSitecoreField('Seats Title'),
    TransferSubtitle: mockSitecoreField('Transfer Subtitle'),
    TransferTitle: mockSitecoreField('Transfer Title {name}'),
    DatesSubtitle: mockSitecoreField('Dates Subtitle'),
    DatesTitle: mockSitecoreField('Dates Title'),
    RoomAndBoardTitle: mockSitecoreField('Room And Board Title'),
    RoomAndBoardSubtitle: mockSitecoreField('Room And Board Subtitle'),
};

const mockProps = {
    fields,
    params: {},
    rendering: {},
};

const email = mockBooking.leadPassenger.email;

describe('SuccessfulAmendmentPopup', () => {
    beforeEach(() => {
        mockStore = createMockStores({
            viewBookingStore: {
                successfulAmendmentStatus: AmendmentType.Seats,
            },
        });
    });

    it('returns null if no successfulAmendmentStatus', () => {
        mockStore.viewBookingStore.successfulAmendmentStatus = null;
        const { container } = render(<SuccessfulAmendmentPopup {...mockProps} />);

        expect(container).toBeEmptyDOMElement();
    });

    it('returns null if no fields', () => {
        //@ts-expect-error no fields
        const { container } = render(<SuccessfulAmendmentPopup />);

        expect(container).toBeEmptyDOMElement();
    });

    it('returns null if no booking', () => {
        mockStore.viewBookingStore.booking = null;
        const { container } = render(<SuccessfulAmendmentPopup {...mockProps} />);

        expect(container).toBeEmptyDOMElement();
    });

    it('calls setSuccessfulAmendmentStatus with null when close button is clicked', async () => {
        render(<SuccessfulAmendmentPopup {...mockProps} />);

        await userEvent.click(screen.getByRole('button', { name: SitecoreDictionary.PaymentButtonsBackToBooking }));

        expect(mockStore.viewBookingStore.setSuccessfulAmendmentStatus).toHaveBeenCalledWith(null);
    });

    it('renders no text if no fields provided', () => {
        mockStore.viewBookingStore.successfulAmendmentStatus = AmendmentType.Flight;
        const testFields = {
            ...fields,
            FlightTitle: null,
            FlightSubtitle: null,
            Description: null,
        };

        render(
            //@ts-expect-error null fields
            <SuccessfulAmendmentPopup
                {...{
                    ...mockProps,
                    fields: testFields,
                }}
            />,
        );

        expect(screen.getByTestId('popup-content')).toBeInTheDocument();

        expect(screen.queryByTestId('successful-amendment-popup-title')).not.toBeInTheDocument();
        expect(screen.queryByTestId('successful-amendment-popup-subtitle')).not.toBeInTheDocument();
        expect(screen.queryByTestId('successful-amendment-popup-confirmation-message')).not.toBeInTheDocument();
    });

    it('renders flight data', () => {
        mockStore.viewBookingStore.successfulAmendmentStatus = AmendmentType.Flight;

        render(<SuccessfulAmendmentPopup {...mockProps} />);

        expect(screen.getByText('Flight Subtitle')).toBeInTheDocument();
        expect(screen.getByText('Flight Title')).toBeInTheDocument();
        expect(screen.getByText(email, { exact: false })).toBeInTheDocument();
    });

    it('renders transfer data', () => {
        mockStore.viewBookingStore.successfulAmendmentStatus = AmendmentType.Transfer;

        render(<SuccessfulAmendmentPopup {...mockProps} />);

        expect(screen.getByText('Transfer Subtitle')).toBeInTheDocument();
        expect(screen.getByText('Transfer Title {name}')).toBeInTheDocument();
        expect(screen.getByText(email, { exact: false })).toBeInTheDocument();
    });

    it('renders dates data', () => {
        mockStore.viewBookingStore.successfulAmendmentStatus = AmendmentType.Dates;

        render(<SuccessfulAmendmentPopup {...mockProps} />);

        expect(screen.getByText('Dates Subtitle')).toBeInTheDocument();
        expect(screen.getByText('Dates Title')).toBeInTheDocument();
        expect(screen.getByText(email, { exact: false })).toBeInTheDocument();
    });

    it('renders seats data', () => {
        mockStore.viewBookingStore.successfulAmendmentStatus = AmendmentType.Seats;

        render(<SuccessfulAmendmentPopup {...mockProps} />);

        expect(screen.getByText('Seats Subtitle')).toBeInTheDocument();
        expect(screen.getByText('Seats Title')).toBeInTheDocument();
        expect(screen.getByText(email, { exact: false })).toBeInTheDocument();
    });

    it('should render room and board data', () => {
        mockStore.viewBookingStore.successfulAmendmentStatus = AmendmentType.RoomAndBoard;

        render(<SuccessfulAmendmentPopup {...mockProps} />);

        expect(screen.getByText('Room And Board Subtitle')).toBeInTheDocument();
        expect(screen.getByText('Room And Board Title')).toBeInTheDocument();
        expect(screen.getByText(email, { exact: false })).toBeInTheDocument();
    });

    it('calls tracking functions on load', () => {
        mockStore.viewBookingStore.successfulAmendmentStatus = AmendmentType.Seats;

        render(<SuccessfulAmendmentPopup {...mockProps} />);

        expect(mockStore.trackingStore.trackSuccessfulAmendment).toHaveBeenCalled();
    });

    it('calls pop up with right parameters', () => {
        render(<SuccessfulAmendmentPopup {...mockProps} />);

        expect(mockPopupProps).toBeCalledWith(
            expect.objectContaining({
                showCloseButton: true,
                isContentCentered: true,
                onClose: expect.any(Function),
                id: 'successful-amend-popup-Seats',
            }),
        );
    });

    it('calls button with right parameters', () => {
        render(<SuccessfulAmendmentPopup {...mockProps} />);

        expect(mockButtonProps).toBeCalledWith(
            expect.objectContaining({
                isMedium: true,
                onClick: expect.any(Function),
            }),
        );
    });

    describe('Accessibility', () => {
        it('should pass accessibility', async () => {
            const { container } = render(<SuccessfulAmendmentPopup {...mockProps} />);
            const results = await axe(container);

            expect(results).toHaveNoViolations();
        });
    });
});
