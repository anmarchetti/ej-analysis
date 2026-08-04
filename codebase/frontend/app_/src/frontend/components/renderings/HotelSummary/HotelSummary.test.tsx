import * as React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe, toHaveNoViolations } from 'jest-axe';

import { createMockStores, mockBooking } from 'frontend/__mocks__';
import { containsLuxuryPromoCode } from 'frontend/utils/offer.utils';
import { mockSitecoreField } from 'frontend/utils/tests.utils';
import cabinBagsFieldsMocks from 'frontend/components/common/Booking/CabinBagsInfo/__mocks__/CabinBagsFields';
import luggageInfoFieldsMocks from 'frontend/components/common/Booking/LuggageInfo/__mocks__/LuggageInfoFields';

import HotelSummary, { THotelSummaryProps } from './HotelSummary';

expect.extend(toHaveNoViolations);

const cabinBagsInfoFields = cabinBagsFieldsMocks();
const luggageInfoFields = luggageInfoFieldsMocks();
const airportParkingInfoFields = {
    AirportParkingTitle: mockSitecoreField('Airport Parking Title'),
    AirportParkingInstructions: mockSitecoreField('Airport Parking Instructions'),
};

const createProps = (): THotelSummaryProps => ({
    fields: {
        ...{
            ButtonCloseLabel: mockSitecoreField('close'),
            PriceTitle: mockSitecoreField('price'),
            Title: mockSitecoreField('your holiday'),
            AltTitle: mockSitecoreField('luxury title'),
            ViewSummaryLabel: mockSitecoreField('show details'),
            ButtonRebookLabel: mockSitecoreField('rebook'),
        },
        ...cabinBagsInfoFields,
        ...luggageInfoFields,
        ...airportParkingInfoFields,
    },
    rendering: {},
    params: { IsOpeningPopupLinkVisible: '1', ShowButtonOnly: undefined },
});

const mockHotelSummaryDetailsComponent = jest.fn();
const mockDrawerComponent = jest.fn();
const mockPopupComponent = jest.fn();
const mockHotelSummaryPreviewComponent = jest.fn();

let props;
let mockContext;
let mockIsMobileViewport = false;

jest.mock('code/endpoints', () => ({
    cmsUrls: {
        media: jest.fn(url => url),
    },
}));

jest.mock('frontend/components/common/Drawer', () => ({
    __esModule: true,
    default: props => {
        mockDrawerComponent(props);

        return <div data-tid='drawer'>{props.children}</div>;
    },
}));

jest.mock('frontend/components/common/Popup', () => {
    const defaultWrapper = (children: React.ReactNode) => children;

    return {
        __esModule: true,
        Popup: props => {
            mockPopupComponent(props);
            const wrapperFn = props.wrapper || defaultWrapper;

            return (
                <div data-tid='popup'>
                    <button onClick={() => props.onClose()}>close-popup</button>
                    {wrapperFn(props.children)}
                </div>
            );
        },
    };
});

jest.mock('frontend/utils/offer.utils', () => ({
    containsLuxuryPromoCode: jest.fn(),
}));

const mockLuxuryWrapperComponent = jest.fn();
jest.mock('frontend/components/common/LuxuryWrapper/LuxuryWrapper', () => ({
    __esModule: true,
    default: props => {
        mockLuxuryWrapperComponent(props);

        return <div data-tid='luxury-wrapper'>{props.children}</div>;
    },
}));

jest.mock('./components/HotelSummaryDetails/HotelSummaryDetails', () => ({
    __esModule: true,
    default: props => {
        mockHotelSummaryDetailsComponent(props);

        return <div data-tid='hotel-summary-details' />;
    },
}));

jest.mock('./components/HotelSummaryPreview/HotelSummaryPreview', () => ({
    __esModule: true,
    default: props => {
        mockHotelSummaryPreviewComponent(props);

        return (
            <div data-tid='hotel-summary-preview'>
                <button onClick={() => props.toggleShowDetails(true)}>open-popup</button>
            </div>
        );
    },
}));

jest.mock('frontend/hooks/useMediaQuery', () => ({
    __esModule: true,
    useMobileViewport: () => mockIsMobileViewport,
}));

jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useContext: () => mockContext,
}));

describe('<HotelSummary />', () => {
    beforeEach(() => {
        props = createProps();
        mockContext = {
            booking: mockBooking,
            ...createMockStores(),
        };
        mockIsMobileViewport = false;
    });

    it('should render hotel preview card', () => {
        render(<HotelSummary {...props} />);

        expect(mockHotelSummaryPreviewComponent).toHaveBeenCalledWith(
            expect.objectContaining({
                title: props.fields.Title,
                viewSummaryLabel: props.fields.ViewSummaryLabel.value,
                shouldShowBtn: true,
            }),
        );

        expect(mockDrawerComponent).not.toHaveBeenCalled();
        expect(mockPopupComponent).not.toHaveBeenCalled();
        expect(mockHotelSummaryDetailsComponent).not.toHaveBeenCalled();
    });

    it('should render view summary button', () => {
        props.params.ShowButtonOnly = '1';
        render(<HotelSummary {...props} />);

        expect(mockHotelSummaryPreviewComponent).not.toHaveBeenCalled();
        const btn = screen.getByTestId('view-summary-btn');
        expect(btn).toBeInTheDocument();
        expect(btn).toHaveClass('primary');
    });

    it('should  display full holiday detail in popup by clicking view summary button', async () => {
        props.params.ShowButtonOnly = '1';
        render(<HotelSummary {...props} />);
        const btn = screen.getByTestId('view-summary-btn');
        await fireEvent.click(btn);
        expect(mockPopupComponent).toHaveBeenCalledWith(expect.objectContaining({ showCloseButton: true }));
    });

    it('should display full holiday detail in popup on desktop when click show full details CTA and close popup when click close CTA', async () => {
        render(<HotelSummary {...props} />);

        await userEvent.click(screen.getByRole('button', { name: 'open-popup' }));

        expect(screen.getByTestId('popup')).toBeInTheDocument();
        expect(mockDrawerComponent).not.toHaveBeenCalled();
        expect(mockPopupComponent).toHaveBeenCalledWith(expect.objectContaining({ showCloseButton: true }));
        expect(mockHotelSummaryDetailsComponent).toHaveBeenCalledWith(
            expect.objectContaining({
                title: props.fields.Title.value,
                priceTitle: props.fields.PriceTitle.value,
                booking: mockContext.booking,
                isTitleIconShown: true,
                cabinBagsInfoFields,
                luggageInfoFields,
            }),
        );

        await userEvent.click(screen.getByRole('button', { name: 'close-popup' }));

        expect(screen.queryByTestId('popup')).not.toBeInTheDocument();
    });

    describe('Drawer renderings', () => {
        beforeEach(() => {
            mockIsMobileViewport = true;
        });

        it('should render a drawer instead of popup on mobile devices', () => {
            render(<HotelSummary {...props} />);

            expect(mockDrawerComponent).toHaveBeenCalledWith(
                expect.objectContaining({
                    open: false,
                }),
            );

            expect(mockHotelSummaryDetailsComponent).toHaveBeenCalledWith(
                expect.objectContaining({
                    title: props.fields.Title.value,
                    priceTitle: props.fields.PriceTitle.value,
                    booking: mockContext.booking,
                }),
            );
        });

        it('should toggle the drawer visibility on click show more details CTA show and drawer close CTA', async () => {
            render(<HotelSummary {...props} />);

            await userEvent.click(screen.getByRole('button', { name: 'open-popup' }));

            expect(mockDrawerComponent).toHaveBeenCalledWith(expect.objectContaining({ open: true }));

            await userEvent.click(screen.getByRole('button', { name: props.fields.ButtonCloseLabel.value }));

            expect(mockDrawerComponent).toHaveBeenCalledWith(expect.objectContaining({ open: false }));
        });
    });

    it('should not render the component when booking is not defined', () => {
        mockContext.booking = undefined;

        const { container } = render(<HotelSummary {...props} />);

        expect(container).toBeEmptyDOMElement();
    });

    it('should not render the component when sitecore fields are not defined', () => {
        props.fields = undefined;

        const { container } = render(<HotelSummary {...props} />);

        expect(container).toBeEmptyDOMElement();
    });

    it('should apply luxury wrapper when booking is a luxury package', async () => {
        const expectedLabel = 'Luxury Label';

        (containsLuxuryPromoCode as jest.Mock).mockReturnValue(true);
        mockContext.layoutStore.getPhrase.mockReturnValue(expectedLabel);

        render(<HotelSummary {...props} />);

        await userEvent.click(screen.getByRole('button', { name: 'open-popup' }));

        expect(mockLuxuryWrapperComponent).toHaveBeenCalled();
    });

    it('should pass the correct title to Details component when luxury package is applied', async () => {
        (containsLuxuryPromoCode as jest.Mock).mockReturnValue(true);

        render(<HotelSummary {...props} />);

        await userEvent.click(screen.getByRole('button', { name: 'open-popup' }));

        expect(mockHotelSummaryDetailsComponent).toHaveBeenCalledWith(
            expect.objectContaining({
                title: 'luxury title',
            }),
        );
    });

    it('should not apply luxury wrapper for a standard booking', async () => {
        (containsLuxuryPromoCode as jest.Mock).mockReturnValue(false);

        render(<HotelSummary {...props} />);

        await userEvent.click(screen.getByRole('button', { name: 'open-popup' }));

        expect(mockLuxuryWrapperComponent).not.toHaveBeenCalled();
    });

    describe('Accessibility', () => {
        it('should pass accessibility', async () => {
            const { container } = render(<HotelSummary {...props} />);

            const results = await axe(container);

            expect(results).toHaveNoViolations();
        });
    });
});
