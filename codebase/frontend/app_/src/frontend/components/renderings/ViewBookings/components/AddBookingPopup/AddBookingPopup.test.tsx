import React, { act } from 'react';
import { fireEvent, render } from '@testing-library/react';

import * as dateUtils from 'frontend/utils/date.utils';
import { getBookingErrorMessageByCode } from 'frontend/utils/getBookingErrorMessageByCode';
import { GuestBookingInfoFields } from 'models/data/GuestBookingInfo';
import { BookingErrorCodes } from 'models/enum/BookingStatus';
import SitePath from 'models/enum/SitePath';

import { AddBookingPopup } from './AddBookingPopup';

const createMockStores = () => ({
    layoutStore: {
        dateLocale: new Date(),
    },
    routerStore: {
        redirectTo: jest.fn(),
    },
});

jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useContext: () => createMockStores(),
}));

jest.mock('frontend/utils/getBookingErrorMessageByCode');

const mockPlaceholderProps = jest.fn();
jest.mock('@sitecore-jss/sitecore-jss-nextjs', () => ({
    __esModule: true,
    Text: props => <span>{props.field?.value}</span>,
    Placeholder: props => {
        mockPlaceholderProps(props);

        return <div data-tid={`placeholder-${props.name}`} />;
    },
}));

jest.mock('frontend/components/common/Popup', () => ({
    __esModule: true,
    Popup: ({ children }) => (
        <div>
            <span>Popup</span>
            <div>{children}</div>
        </div>
    ),
}));

jest.mock('frontend/components/common/ValidatableDateField', () => ({
    __esModule: true,
    default: ({ id, onChange, onBlur }) => (
        <div data-testid={id}>
            <input id={id} onChange={() => onChange('value')} onBlur={onBlur} />
        </div>
    ),
}));

jest.mock('frontend/components/common/ValidatableField/ValidatableField', () => ({
    __esModule: true,
    default: ({ id, onChange }) => (
        <button
            id={id}
            onClick={() => {
                onChange('value');
            }}
        >
            ValidatableField
        </button>
    ),
}));

jest.mock('frontend/components/common/RichTextWithLinks', () => ({
    __esModule: true,
    default: ({ field, onLinkClick }) => (
        <div onClick={onLinkClick} className='RichTextWithLinks'>
            <span>RichTextWithLinks</span>
            <span>{field?.value}</span>
        </div>
    ),
}));

const mockButton = jest.fn();
jest.mock('frontend/components/common/Button', () => ({
    __esModule: true,
    default: props => {
        mockButton(props);

        return <button data-tid={props.dataTid}>{props.children}</button>;
    },
}));

describe('<AddBookingPopup />', () => {
    const resetMocks = () =>
        ({
            addBookingInfo: {
                onChangeField: jest.fn(),
                departureDate: '13123123',
                bookingReference: '213123',
                lastName: '23123',
                isValid: true,
            },
            isAddingBooking: false,
            error: null,
            hasBookingAdded: false,
            fields: { BookingAddedSuccess: { value: '' }, TradeBookingAddingError: { value: 'Trade Error' } },
            addBooking: jest.fn(),
            onClose: jest.fn(),
            clearError: jest.fn(),
            getPhrase: jest.fn(),
            userData: null,
            isLoggedIn: false,
            findAddedBooking: jest.fn(),
            rendering: { componentName: 'AddBookingPopup' },
        } as any);

    let mocks = resetMocks();

    beforeEach(() => {
        mocks = resetMocks();
    });

    describe('Rendering', () => {
        it('should render Popup', () => {
            const { queryByText } = render(<AddBookingPopup {...mocks} />);
            expect(queryByText('Popup')).toBeInTheDocument();
        });

        it('should render success screen', () => {
            mocks.hasBookingAdded = true;
            mocks.fields.BookingAddedSuccess.value = 'TEST';
            const { queryByText } = render(<AddBookingPopup {...mocks} />);

            expect(queryByText('Popup')).toBeInTheDocument();
            expect(queryByText('TEST')).toBeInTheDocument();
            expect(mockButton).toHaveBeenCalledWith(
                expect.objectContaining({
                    dataTid: 'added-booking-popup-button',
                    isMedium: true,
                    className: 'mt-3',
                }),
            );
        });

        it('should be render add booking screen', () => {
            const { queryByText, getAllByText, container } = render(<AddBookingPopup {...mocks} />);

            expect(queryByText('Popup')).toBeInTheDocument();
            expect(getAllByText('ValidatableField').length).toBe(2);
            expect(container.querySelector('#departureDate')).toBeInTheDocument();
        });

        it('should render error message', () => {
            mocks.error = 'error';
            const { container } = render(<AddBookingPopup {...mocks} />);

            expect(container.querySelector('.error-container')).toBeInTheDocument();
            expect(getBookingErrorMessageByCode).toHaveBeenCalledWith('error');
        });

        it('should render unique error message if trade booking was tried to assign', () => {
            mocks.error = BookingErrorCodes.AssignAgentBooking;
            const { getByText } = render(<AddBookingPopup {...mocks} />);

            expect(getByText('Trade Error')).toBeInTheDocument();
        });
    });

    describe('Events', () => {
        it('should handle error link click', () => {
            mocks.error = BookingErrorCodes.AssignAgentBooking;
            const { container } = render(<AddBookingPopup {...mocks} />);
            const errorDescription = container.querySelector('.RichTextWithLinks');
            expect(errorDescription).toBeInTheDocument();

            fireEvent.click(errorDescription!, { target: { href: SitePath.Login } });

            expect(mocks.findAddedBooking).toHaveBeenCalled();
            expect(mocks.onClose).toHaveBeenCalled();
        });

        it('should call onChange on click on fields', () => {
            const { container } = render(<AddBookingPopup {...mocks} />);
            const departureDate = container.querySelector('#departureDate');
            const bookingReference = container.querySelector('#bookingReference');
            const lastName = container.querySelector('#lastName');
            expect(departureDate).toBeInTheDocument();
            expect(bookingReference).toBeInTheDocument();
            expect(lastName).toBeInTheDocument();

            fireEvent.change(departureDate!, { target: { value: 'value' } });
            expect(mocks.addBookingInfo.onChangeField).toHaveBeenCalledWith(
                GuestBookingInfoFields.DepartureDate,
                'value',
            );

            fireEvent.click(bookingReference!);
            expect(mocks.addBookingInfo.onChangeField).toHaveBeenCalledWith(
                GuestBookingInfoFields.BookingReference,
                'value',
            );

            fireEvent.click(lastName!);
            expect(mocks.addBookingInfo.onChangeField).toHaveBeenCalledWith(GuestBookingInfoFields.LastName, 'value');
        });

        it('should invoke onChangeLastName', () => {
            mocks.addBookingInfo.lastName = '';
            mocks.isLoggedIn = true;
            mocks.userData = true;
            render(<AddBookingPopup {...mocks} />);

            expect(mocks.addBookingInfo.onChangeField).toHaveBeenCalled();
        });
    });

    it('should call autoCompleteDateYear on departure date blur', () => {
        jest.spyOn(dateUtils, 'autoCompleteDateYear').mockReturnValue('10/10/2024');
        mocks.addBookingInfo.departureDate = '10/10/24';
        const { container } = render(<AddBookingPopup {...mocks} />);
        const departureDate = container.querySelector('#departureDate') as HTMLInputElement;

        act(() => {
            fireEvent.blur(departureDate);
        });

        expect(dateUtils.autoCompleteDateYear).toHaveBeenCalledWith('10/10/24');

        expect(mocks.addBookingInfo.onChangeField).toHaveBeenCalledWith(
            GuestBookingInfoFields.DepartureDate,
            '10/10/2024',
        );
    });

    describe('FlightAndHotelBanner Placeholder', () => {
        it('should render FlightAndHotelBanner placeholder in add booking form', () => {
            const { queryByTestId } = render(<AddBookingPopup {...mocks} />);

            expect(queryByTestId('placeholder-flight-and-hotel-banner')).toBeInTheDocument();
            expect(mockPlaceholderProps).toHaveBeenCalledWith(
                expect.objectContaining({
                    name: 'flight-and-hotel-banner',
                    rendering: mocks.rendering,
                }),
            );
        });

        it('should NOT render FlightAndHotelBanner placeholder on success screen', () => {
            mocks.hasBookingAdded = true;
            const { queryByTestId } = render(<AddBookingPopup {...mocks} />);

            expect(queryByTestId('placeholder-flight-and-hotel-banner')).not.toBeInTheDocument();
        });
    });
});
