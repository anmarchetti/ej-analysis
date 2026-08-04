import React from 'react';
import { render, screen } from '@testing-library/react';

import { createMockStores, mockedPoster, mockLuggageListFields } from 'frontend/__mocks__';
import { mockSitecoreField } from 'frontend/utils/tests.utils';
import SitecoreDictionary from 'models/enum/SitecoreDictionary';
import { IExportHolidayDetailsFields } from 'frontend/components/renderings/ExportHolidayDetails/ExportHolidayDetails';

import ExtrasLayout from './ExtrasLayout';

const mockPriceSummaryComponent = jest.fn();
const mockTradePortalViewBookingQuoteComponent = jest.fn();

jest.mock('frontend/components/renderings/TradePortalViewBooking/TradePortalViewBookingQuote', () => ({
    __esModule: true,
    default: props => {
        mockTradePortalViewBookingQuoteComponent(props);

        return <div data-tid='trade-portal-view-booking-quote' />;
    },
}));
jest.mock('frontend/components/renderings/Payment/components/BookingDetailsExpanded/BookingDetailsQuote', () => ({
    __esModule: true,
    default: () => <div data-tid='booking-details-quote' />,
}));
jest.mock('frontend/components/renderings/PriceSummary/PriceSummary', () => ({
    __esModule: true,
    default: props => {
        mockPriceSummaryComponent(props);

        return <div data-tid='price-summary' />;
    },
}));
jest.mock('react-tooltip', () => ({
    Tooltip: jest.fn().mockImplementation(() => <div role='tooltip' />),
}));

const createPoster = () => ({ ...mockedPoster });
const createStores = () =>
    createMockStores({
        appStore: { isScreenLessMedium: false },
        bookingStore: {
            hotel: {},
            selectedOffer: { accom: { unit: [] }, hotel: {}, date: '2020-09-02T00:00:00', stay: 2 },
            packageInfo: {},
            alternativeTransfers: [],
        },
        layoutStore: {
            getPhrase: jest.fn(p => p),
            isEditMode: false,
        },
        userStore: {
            agentInfo: {
                agentName: 'Agent Name',
            },
        },
    });

const createProps: () => any = () => ({
    fields: {
        LogoCheckboxLabel: mockSitecoreField('Place easyJet holidays logo'),
        DownloadLabel: mockSitecoreField('Download'),
        ExportPromoLabel: mockSitecoreField('Export promotional poster'),
        ExportPromoTooltip: mockSitecoreField(`You're able to download a summary of the holiday as a PDF file.`),
        ReturnLabel: mockSitecoreField('Back to extras'),
        LogoImage: mockSitecoreField({
            src: '/holidays/cms/media/-/jssmedia/project/trade-portal/easyjet-holidays-lockup-brand.ashx?h=111&iar=0&w=172&hash=96F0A393B57127DB319E0D2AF7ECAD05',
            alt: 'easyJet Holidays Lockup Brand',
            width: 172,
            height: 111,
        }),
        Logos: mockSitecoreField({
            src: '/holidays/cms/media/-/jssmedia/project/trade-portal/easyjet-holidays-lockup-brand.ashx?h=111&iar=0&w=172&hash=96F0A393B57127DB319E0D2AF7ECAD05',
            alt: 'easyJet Holidays Lockup Brand',
            width: 172,
            height: 111,
        }),
        Title: mockSitecoreField("You're about to download a summary of the holiday as a PDF file"),
        Description: mockSitecoreField('Please have a look at a preview of the PDF'),
        ...mockLuggageListFields,
    } as IExportHolidayDetailsFields,
    params: {},
});

let mockPoster = createPoster();
let mockStores = createStores();
let mockProps = createProps();

jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useContext: () => ({ ...mockStores, ...mockPoster }),
}));

const mockLuxuryWrapper = jest.fn();
jest.mock('frontend/components/common/LuxuryWrapper/LuxuryWrapper', () => ({
    __esModule: true,
    default: ({ children, ...props }) => {
        mockLuxuryWrapper(props);

        return <div data-tid='luxury-wrapper'>{children}</div>;
    },
}));

describe('<ExtrasLayout />', () => {
    beforeEach(() => {
        mockStores = createStores();
        mockProps = createProps();
        mockPoster = createPoster();
    });

    it('should render logo by default', () => {
        render(<ExtrasLayout {...mockProps} />);

        expect(screen.getByTestId('easyjet-logo')).toBeInTheDocument();
    });

    it('should NOT render logo when user remove it', () => {
        mockPoster.hasEjLogo = false;
        render(<ExtrasLayout {...mockProps} />);

        expect(screen.queryByTestId('easyjet-logo')).not.toBeInTheDocument();
    });

    it('should NOT render logo when no field found', () => {
        mockProps.fields.LogoImage = null;
        render(<ExtrasLayout {...mockProps} />);

        expect(screen.queryByTestId('easyjet-logo')).not.toBeInTheDocument();
    });

    it('should render additional logos by default', () => {
        render(<ExtrasLayout {...mockProps} />);

        expect(screen.getByTestId('additional-logos')).toBeInTheDocument();
    });

    it('should NOT render additional logos when no field found', () => {
        mockProps.fields.Logos = null;
        render(<ExtrasLayout {...mockProps} />);

        expect(screen.queryByTestId('additional-logos')).not.toBeInTheDocument();
    });

    it('should render BookingDetailsQuote', () => {
        render(<ExtrasLayout {...mockProps} />);

        expect(screen.getByTestId('booking-details-quote')).toBeInTheDocument();
    });

    it('should render TradePortalViewBookingQuote', () => {
        render(<ExtrasLayout {...mockProps} />);

        expect(screen.getByTestId('trade-portal-view-booking-quote')).toBeInTheDocument();
        expect(mockTradePortalViewBookingQuoteComponent).toHaveBeenCalledWith({
            booking: {
                guests: [],
                hotel: {},
                extraLuggageInfo: { items: [] },
                isLoggedInAsLeadPassenger: true,
                package: {
                    accom: { endDate: 'Fri Sep 04 2020', hotel: {}, rooms: [], startDate: 'Wed Sep 02 2020', unit: [] },
                    date: '2020-09-02T00:00:00',
                    hotel: {},
                    location: { city: undefined, country: undefined, region: undefined },
                    stay: 2,
                },
                transfers: [],
            },
        });
    });

    it('should render PriceSummary', () => {
        render(<ExtrasLayout {...mockProps} />);

        expect(screen.getByTestId('price-summary')).toBeInTheDocument();
        expect(mockPriceSummaryComponent).toHaveBeenCalledWith({ isPrintPreview: true });
    });

    it('should render ExportHolidayFooter', () => {
        render(<ExtrasLayout {...mockProps} />);

        expect(screen.getByTestId('export-holiday-details-footer')).toBeInTheDocument();
    });

    it('should NOT apply luxury styles when isLuxuryPackage is false', () => {
        mockStores.bookingStore.isLuxuryPackage = false;
        render(<ExtrasLayout {...mockProps} />);

        expect(screen.getByTestId('poster')).not.toHaveClass('posterLuxury');
        expect(screen.getByTestId('poster-toolbar')).not.toHaveClass('viewBookingToolbarLuxury');
        expect(mockLuxuryWrapper).toHaveBeenCalledWith({
            label: SitecoreDictionary.GlobalsLabelsLuxuryCollection,
            renderChildrenOnly: true,
            wrapperClassName: 'luxuryWrapper',
            contentClassName: 'luxuryContent',
            bannerClassName: 'luxuryBanner',
        });
    });

    it('should apply luxury styles when isLuxuryPackage is true', () => {
        mockStores.bookingStore.isLuxuryPackage = true;
        render(<ExtrasLayout {...mockProps} />);

        expect(screen.getByTestId('poster')).toHaveClass('posterLuxury');
        expect(screen.getByTestId('poster-toolbar')).toHaveClass('viewBookingToolbarLuxury');
        expect(mockLuxuryWrapper).toHaveBeenCalledWith({
            label: SitecoreDictionary.GlobalsLabelsLuxuryCollection,
            renderChildrenOnly: false,
            wrapperClassName: 'luxuryWrapper',
            contentClassName: 'luxuryContent',
            bannerClassName: 'luxuryBanner',
        });
    });
});
