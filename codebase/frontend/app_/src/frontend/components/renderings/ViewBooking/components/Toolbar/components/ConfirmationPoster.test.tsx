import React from 'react';
import { render, screen } from '@testing-library/react';

import { mockBooking, mockedPoster, mockLuggageListFields } from 'frontend/__mocks__';
import { mockSitecoreField } from 'frontend/utils/tests.utils';
import { PlaceholderNames } from 'models/enum/PlaceholderNames';

import ConfirmationPoster, { IConfirmationPoster } from './ConfirmationPoster';

const createPoster = () => ({ ...mockedPoster });

const mockViewBookingHotel = jest.fn();
jest.mock('frontend/components/renderings/ViewBooking/components/Hotel/ViewBookingHotel', () => ({
    __esModule: true,
    default: props => {
        mockViewBookingHotel(props);

        return <div data-tid='booking-hotel' />;
    },
}));
jest.mock('frontend/components/renderings/ViewBooking/components/ViewBookingHolidayDetails', () => ({
    __esModule: true,
    default: () => <div data-tid='view-booking-holiday-details' />,
}));
jest.mock('frontend/components/common/Callout/Callout', () => ({
    __esModule: true,
    default: () => <div data-tid='tooltip' />,
}));

const mockPlaceholderComponent = jest.fn();
jest.mock('@sitecore-jss/sitecore-jss-nextjs', () => ({
    __esModule: true,
    ...jest.requireActual('@sitecore-jss/sitecore-jss-nextjs'),
    Placeholder: ({ children, ...props }) => {
        mockPlaceholderComponent(props);

        return <div data-tid='placeholder' />;
    },
}));

jest.mock('frontend/components/renderings/static/ComponentWrapper', () => ({
    __esModule: true,
    default: ({ children }) => <div data-tid='component-wrapper'>{children}</div>,
}));

jest.mock('frontend/components/common/Booking/BookingRefs/BookingRefs', () => ({
    __esModule: true,
    default: ({ children }) => <div data-tid='booking-refs'>{children}</div>,
}));

const createStores = () => ({
    appStore: { isScreenLessMedium: false },
    layoutStore: { getPhrase: jest.fn(p => p) },
});

const createProps = (): IConfirmationPoster => ({
    fields: {
        YourHolidayQuoteLabel: mockSitecoreField('Your holiday quote'),
        LogoCheckboxLabel: mockSitecoreField('Place easyJet holidays logo'),
        DownloadLabel: mockSitecoreField('Download'),
        DownloadButton: mockSitecoreField('Download PDF'),
        ExportPromoLabel: mockSitecoreField('Export promotional poster'),
        ExportPromoTooltip: mockSitecoreField(`You're able to download a summary of the holiday as a PDF file.`),
        ReturnLabel: mockSitecoreField('Back'),
        LogoImage: {
            value: {
                src: '/holidays/cms/media/-/jssmedia/project/trade-portal/easyjet-holidays-lockup-brand.ashx?h=111&iar=0&w=172&hash=96F0A393B57127DB319E0D2AF7ECAD05',
                alt: 'easyJet Holidays Lockup Brand',
                width: 172,
                height: 111,
            },
        },
        Logos: {
            value: {
                src: '/holidays/cms/media/-/jssmedia/project/trade-portal/easyjet-holidays-lockup-brand.ashx?h=111&iar=0&w=172&hash=96F0A393B57127DB319E0D2AF7ECAD05',
                alt: 'easyJet Holidays Lockup Brand',
                width: 172,
                height: 111,
            },
        },
        Title: mockSitecoreField("You're about to download a summary of the holiday as a PDF file"),
        Description: mockSitecoreField('Please have a look at a preview of the PDF'),
        ...mockLuggageListFields,
    },
    booking: mockBooking,
    rendering: {
        componentName: 'name',
    },
});

let mockPoster = createPoster();
let mockStores = createStores();
let mockProps = createProps();

jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useContext: () => ({ ...mockStores, ...mockPoster }),
}));

const mockPosterErrorComponent = jest.fn();
const mockPosterTriggerComponent = jest.fn();
const mockPosterContentComponent = jest.fn();

jest.mock('frontend/components/common/Poster', () => ({
    __esModule: true,
    Root: ({ children }) => <div data-tid='poster-root'>{children}</div>,
    Trigger: ({ children, ...props }) => {
        mockPosterTriggerComponent(props);

        return <div data-tid='poster-trigger'>{children}</div>;
    },
    Error: ({ children, ...props }) => {
        mockPosterErrorComponent(props);

        return <div data-tid='poster-error'>{children}</div>;
    },
    Content: ({ children, ...props }) => {
        mockPosterContentComponent(props);

        return <div data-tid='poster-content'>{children}</div>;
    },
}));

describe('<ConfirmationPoster />', () => {
    beforeEach(() => {
        mockStores = createStores();
        mockProps = createProps();
        mockPoster = createPoster();
    });

    it('should render open link', () => {
        const { getByText } = render(<ConfirmationPoster {...mockProps} />);

        expect(getByText(mockProps.fields!.DownloadButton!.value)).toBeInTheDocument();
    });

    it('should not render open link', () => {
        const expectedValue = mockProps.fields!.DownloadButton!.value;
        mockProps.fields = null as any;
        const { queryByText } = render(<ConfirmationPoster {...mockProps} />);

        expect(queryByText(expectedValue)).not.toBeInTheDocument();
    });

    it('should render logo by when user adds it', () => {
        mockPoster.activeId = 'default';
        mockPoster.hasEjLogo = true;
        const { getByTestId } = render(<ConfirmationPoster {...mockProps} />);

        expect(getByTestId('easyjet-logo')).toBeInTheDocument();
    });

    it('should NOT render logo when user remove it', () => {
        mockPoster.activeId = 'default';
        mockPoster.hasEjLogo = false;
        const { queryByTestId } = render(<ConfirmationPoster {...mockProps} />);

        expect(queryByTestId('easyjet-logo')).not.toBeInTheDocument();
    });

    it('should render content correctly', () => {
        render(<ConfirmationPoster {...mockProps} />);

        expect(mockPosterContentComponent).toHaveBeenCalledWith({
            DownloadLabel: mockSitecoreField('Download'),
            LogoCheckboxLabel: mockSitecoreField('Place easyJet holidays logo'),
            ReturnLabel: mockSitecoreField('Back'),
            hasLargeFormat: true,
            id: 'default',
            posterName: 'Hotel Example',
        });
        expect(mockPlaceholderComponent).toHaveBeenCalledWith(
            expect.objectContaining({
                name: PlaceholderNames.ViewBookingCost,
                rendering: mockProps.rendering,
                subtitleClassName: expect.any(String),
                titleClassName: expect.any(String),
            }),
        );
        expect(mockViewBookingHotel).toHaveBeenCalledWith({
            booking: mockProps.booking,
            rendering: mockProps.rendering,
            isPrintPreview: true,
        });
        expect(screen.getByTestId('toolbar')).toHaveClass('toolbar');
    });

    it('should render trigger correctly', () => {
        render(<ConfirmationPoster {...mockProps} />);

        expect(mockPosterTriggerComponent).toHaveBeenCalledWith({ id: 'default' });
    });

    it('should render error correctly', () => {
        render(<ConfirmationPoster {...mockProps} />);

        expect(mockPosterErrorComponent).toHaveBeenCalled();
    });
});
