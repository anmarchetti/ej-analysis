import React from 'react';
import { render, screen } from '@testing-library/react';

import { createMockStores, mockBooking } from 'frontend/__mocks__';
import { mockSitecoreField } from 'frontend/utils/tests.utils';
import { BookingStatus } from 'models/enum/BookingStatus';

import CheckInBanner, { TCheckInBannerProps } from './CheckInBanner';

const createStores = () =>
    createMockStores({
        viewBookingStore: {
            booking: mockBooking,
        },
        bookingStore: { isCheckInAvailable: jest.fn(() => true) },
    });

const createProps = (): TCheckInBannerProps => ({
    fields: {
        CTALabel: mockSitecoreField('CTA label'),
        Subtext: mockSitecoreField('sub text'),
        Title: mockSitecoreField('title'),
    },
    rendering: {},
    params: {},
});

let mockProps: TCheckInBannerProps;
let mockStores;

const mockRichTextWithLinks = jest.fn();
jest.mock('frontend/components/common/RichTextWithLinks', () => props => {
    mockRichTextWithLinks(props);

    return <div data-tid='rich-text-with-links'>{props.field.value}</div>;
});

const mockText = jest.fn();
jest.mock('@sitecore-jss/sitecore-jss-nextjs', () => ({
    __esModule: true,
    Text: props => {
        mockText(props);

        return <div data-tid='sitecore-jss-text'>{props.field.value}</div>;
    },
}));

jest.mock('next/link', () => ({ children, ...props }) => (
    <a data-tid='next-link' {...props}>
        {children}
    </a>
));

jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useContext: () => mockStores,
}));

let mockFlightsReferences: Array<string> = [];
jest.mock('frontend/utils/route.utils', () => ({
    __esModule: true,
    getFlightsReferences: jest.fn(() => mockFlightsReferences),
}));

let mockCheckInLink: Nullable<string> = 'check-in-link';
jest.mock('frontend/utils/viewBooking.utils', () => ({
    __esModule: true,
    getCheckInLink: jest.fn(() => mockCheckInLink),
}));

describe('<CheckInBanner />', () => {
    beforeEach(() => {
        mockProps = createProps();
        mockStores = createStores();
    });

    it('Should render component', () => {
        render(<CheckInBanner {...mockProps} />);

        expect(screen.getByTestId('check-in-banner')).toBeInTheDocument();
        expect(mockRichTextWithLinks).toHaveBeenCalledWith({
            className: 'subtext',
            dataId: 'check-in-banner-subtitle',
            field: { value: 'sub text' },
        });
        expect(mockText).toHaveBeenCalledWith({
            className: 'title',
            'data-tid': 'check-in-banner-title',
            field: { value: 'title' },
            tag: 'h2',
        });

        const link = screen.getByRole('link', { name: mockProps.fields?.CTALabel.value });
        expect(link).toBeInTheDocument();
        expect(link).toHaveAttribute('href', mockCheckInLink);
        expect(link).toHaveAttribute('target', '_blank');
        expect(link).toHaveAttribute('rel', 'noopener noreferrer');

        expect(screen.getByTestId('rich-text-with-links')).toHaveTextContent(mockProps.fields!.Subtext.value);
        expect(screen.getByTestId('sitecore-jss-text')).toHaveTextContent(mockProps.fields!.Title.value);
    });

    it('Should NOT render component if fields is not defined', () => {
        mockProps.fields = undefined;
        const { container } = render(<CheckInBanner {...mockProps} />);

        expect(container).toBeEmptyDOMElement();
    });

    it('Should NOT render component if booking is not defined', () => {
        mockStores.viewBookingStore.booking = undefined;
        const { container } = render(<CheckInBanner {...mockProps} />);

        expect(container).toBeEmptyDOMElement();
    });

    it('Should NOT render component if check in link is not defined', () => {
        mockCheckInLink = null;
        const { container } = render(<CheckInBanner {...mockProps} />);

        expect(container).toBeEmptyDOMElement();
    });

    it('Should NOT render component if booking is canceled', () => {
        mockStores.viewBookingStore.booking.bookingStatus = BookingStatus.Canceled;
        const { container } = render(<CheckInBanner {...mockProps} />);

        expect(container).toBeEmptyDOMElement();
    });

    it('Should NOT render component if check in is not available', () => {
        mockStores.bookingStore.isCheckInAvailable = jest.fn(() => false);
        const { container } = render(<CheckInBanner {...mockProps} />);

        expect(container).toBeEmptyDOMElement();
    });

    it('Should NOT render component if booking has multiple flight references', () => {
        mockFlightsReferences = ['flight-reference-code-1', 'flight-reference-code-2'];
        const { container } = render(<CheckInBanner {...mockProps} />);

        expect(container).toBeEmptyDOMElement();
    });
});
