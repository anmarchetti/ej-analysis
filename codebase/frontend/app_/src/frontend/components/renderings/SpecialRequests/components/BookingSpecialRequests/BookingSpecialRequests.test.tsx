import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';

import { createMockStores } from 'frontend/__mocks__';
import { IBookingInfo } from 'models/data/IBookingInfo';
import { BookingStatus } from 'models/enum/BookingStatus';
import { specialRequestsFields } from 'frontend/components/renderings/SpecialRequests/__mocks__/SpecialRequestsFields';

import { BookingSpecialRequests, IBookingSpecialRequestsProps } from './BookingSpecialRequests';

const createProps = (): IBookingSpecialRequestsProps => ({
    booking: {
        bookingStatus: 'Booking',
        isLoggedInAsLeadPassenger: false,
        amendmentInfo: {
            specialRequest: false,
        },
        specialRequests: [{ code: 'R1', name: 'Request 1', displayName: 'Request 1' }],
    } as IBookingInfo,
    fields: specialRequestsFields,
    params: {
        IsSleekDesign: undefined,
    },
    withAmendment: false,
});

let props: IBookingSpecialRequestsProps;
let mockStores;

jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useContext: () => mockStores,
}));

const mockSpecialRequestItem = jest.fn();

jest.mock('frontend/components/renderings/SpecialRequests/components/SpecialRequestItem/SpecialRequestItem', () => ({
    __esModule: true,
    default: props => {
        mockSpecialRequestItem(props);

        return <div data-tid='special-request-item' />;
    },
}));

const mockAmendPopup = jest.fn();
const mockedAmendBtnText = 'submit button';

jest.mock(
    'frontend/components/renderings/SpecialRequests/components/BookingSpecialRequestsAmendPopup/BookingSpecialRequestsAmendPopup',
    () => ({
        __esModule: true,
        default: props => {
            mockAmendPopup(props);

            return (
                <div data-tid='amend-popup'>
                    <button data-tid='amend-popup-submit' onClick={props.onSubmit}>
                        {mockedAmendBtnText}
                    </button>
                </div>
            );
        },
    }),
);

const mockViewBookingComponentWrapperProps = jest.fn();
jest.mock('frontend/components/common/ViewBookingComponentWrapper/ViewBookingComponentWrapper', () => ({
    __esModule: true,
    default: ({ dataTid, Title, children, id }) => {
        mockViewBookingComponentWrapperProps({ dataTid, Title, children, id });

        return (
            <div data-tid={dataTid} id={id}>
                {children}
            </div>
        );
    },
}));

const mockRichTextWithLinksProps = jest.fn();

jest.mock('frontend/components/common/RichTextWithLinks', () => ({
    __esModule: true,
    default: props => {
        mockRichTextWithLinksProps(props);

        return <div data-tid='rich-text'>{props.field.value}</div>;
    },
}));

describe('<BookingSpecialRequests />', () => {
    beforeEach(() => {
        props = createProps();
        mockStores = createMockStores({
            layoutStore: {
                isTradePortal: false,
            },
            viewBookingStore: {
                isAmendSSRFailed: false,
                isAmendSSRLoading: false,
                amendBookingSpecialRequests: jest.fn(),
                resetAmendSSR: jest.fn(),
                hasBookingAtcomError: false,
            },
            tracking: {
                clickTrackingSRCTA: jest.fn(),
            },
        });
    });

    it('should NOT render if no fields', () => {
        props.fields = undefined;
        const { container } = render(<BookingSpecialRequests {...props} />);

        expect(container).toBeEmptyDOMElement();
    });

    it('Should NOT render CTA with atcom error', () => {
        mockStores.viewBookingStore.hasBookingAtcomError = true;
        render(<BookingSpecialRequests {...props} />);

        expect(screen.queryByRole('button', { name: props.fields?.EditRequestsCTA.value })).not.toBeInTheDocument();
    });

    it('Should render just list of requests if it is without amendment', () => {
        render(<BookingSpecialRequests {...props} />);

        expect(mockViewBookingComponentWrapperProps).toHaveBeenCalledWith(
            expect.objectContaining({ Title: props.fields!.AddRequestTitle }),
        );
        expect(screen.queryAllByTestId('special-request-item')).toHaveLength(props.booking.specialRequests!.length);
        expect(screen.queryByTestId('amend-popup')).not.toBeInTheDocument();
    });

    it('should render view booking title and subtitle if sleek design', () => {
        props.params.IsSleekDesign = '1';
        render(<BookingSpecialRequests {...props} />);

        expect(mockViewBookingComponentWrapperProps).toHaveBeenCalledWith(
            expect.objectContaining({ Title: props.fields!.ViewBookingContentRequestTitle }),
        );

        expect(screen.getByRole('heading', { level: 6 })).toHaveTextContent(
            props.fields!.ViewBookingContentRequestSubtitle.value,
        );
    });

    it("Should render just list of requests if booking can't be amended", () => {
        props.withAmendment = true;
        props.booking.isLoggedInAsLeadPassenger = true;
        props.booking.amendmentInfo!.specialRequest = false;
        render(<BookingSpecialRequests {...props} />);

        expect(screen.getAllByTestId('special-request-item')).toHaveLength(props.booking.specialRequests!.length);
        expect(screen.queryByTestId('amend-popup')).not.toBeInTheDocument();
        expect(screen.queryByRole('button', { name: props.fields?.EditRequestsCTA.value })).not.toBeInTheDocument();
    });

    it('Should render just list of requests if booking is cancelled', () => {
        props.withAmendment = true;
        props.booking.isLoggedInAsLeadPassenger = true;
        props.booking.bookingStatus = BookingStatus.Canceled;
        render(<BookingSpecialRequests {...props} />);

        expect(screen.queryByRole('button', { name: props.fields?.EditRequestsCTA.value })).not.toBeInTheDocument();
        expect(screen.getAllByTestId('special-request-item')).toHaveLength(props.booking.specialRequests!.length);
        expect(screen.queryByTestId('amend-popup')).not.toBeInTheDocument();
    });

    it('Should render just list of requests if lead is not logged in', () => {
        props.withAmendment = true;
        props.booking.amendmentInfo!.specialRequest = true;
        props.booking.isLoggedInAsLeadPassenger = false;
        render(<BookingSpecialRequests {...props} />);

        expect(screen.queryByRole('button', { name: props.fields?.EditRequestsCTA.value })).not.toBeInTheDocument();

        expect(screen.getAllByTestId('special-request-item')).toHaveLength(props.booking.specialRequests!.length);

        expect(screen.queryByTestId('amend-popup')).not.toBeInTheDocument();
    });

    describe('Amendment', () => {
        beforeEach(() => {
            props.withAmendment = true;
            props.booking.amendmentInfo!.specialRequest = true;
            props.booking.isLoggedInAsLeadPassenger = true;
        });

        it('Should render content for adding request if no requests and amendment is allowed', () => {
            props.booking.specialRequests = [];
            render(<BookingSpecialRequests {...props} />);

            expect(mockViewBookingComponentWrapperProps).toHaveBeenCalledWith(
                expect.objectContaining({ Title: props.fields!.AddRequestTitle }),
            );
            expect(screen.queryAllByTestId('special-request-item').length).toBe(0);

            expect(mockRichTextWithLinksProps).toHaveBeenCalledWith({
                field: props.fields!.AddRequestDescription,
            });
            expect(screen.getByTestId('rich-text')).toHaveTextContent(props.fields!.AddRequestDescription.value);
        });

        it('Should render requests and amend button', () => {
            render(<BookingSpecialRequests {...props} />);

            expect(screen.getAllByTestId('special-request-item')).toHaveLength(props.booking.specialRequests!.length);
            expect(screen.getByTestId('amend-popup')).toBeInTheDocument();
        });

        it('Should render Amend Popup initially closed', () => {
            render(<BookingSpecialRequests {...props} />);

            expect(mockAmendPopup).toHaveBeenCalledWith(expect.objectContaining({ isOpen: false }));
        });

        it('Should submit Amendment', async () => {
            render(<BookingSpecialRequests {...props} />);

            await fireEvent.click(screen.getByRole('button', { name: mockedAmendBtnText }));

            expect(mockStores.viewBookingStore.amendBookingSpecialRequests).toHaveBeenCalled();
        });
    });
});
