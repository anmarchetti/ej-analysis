import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { createMockStores } from 'frontend/__mocks__';
import { DestinationPageTemplateName } from 'frontend/hooks/useHolidaysDestinationPageTypeName';
import offersService from 'frontend/services/offers.service';
import { ILivePrice } from 'models/data/ILivePrice';
import SitecoreDictionary from 'models/enum/SitecoreDictionary';
import { EventTypes } from 'models/enum/tracking/EventTypes';
import { EventActions, EventCategories } from 'models/enum/tracking/GenericEventParams';

import { ILivePriceProps, LivePrice } from './LivePrice';

jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useContext: () => mockStores,
}));

let mockUseHolidaysDestinationPageTypeName: DestinationPageTemplateName | undefined;

jest.mock('frontend/hooks/useHolidaysDestinationPageTypeName', () => ({
    ...jest.requireActual('frontend/hooks/useHolidaysDestinationPageTypeName'),
    __esModule: true,
    default: () => mockUseHolidaysDestinationPageTypeName,
}));

jest.mock('frontend/components/icons-new/ChevronRight', () => () => <div data-tid='chevron-icon' />);

const mockPriceLabel = jest.fn();

jest.mock('frontend/components/common/PriceLabel/PriceLabel', () => ({
    __esModule: true,
    default: ({ price, chevronIcon, wrapLabelBeforePrice, wrapLabelAfterPrice, wrapPrice, ...props }) => {
        mockPriceLabel(props);

        return (
            <div data-tid='price-label'>
                <span>{price}</span>
                <span>{chevronIcon}</span>
                {wrapLabelBeforePrice('before')}
                {wrapLabelAfterPrice('after')}
                {wrapPrice('price')}
            </div>
        );
    },
}));

jest.mock('frontend/components/common/TouristTaxGenericTooltip/TouristTaxGenericTooltip', () => ({
    __esModule: true,
    TouristTaxGenericTooltip: ({ children }) => <div data-tid='tax-tooltip'>{children}</div>,
}));

const mockLink = jest.fn();

jest.mock('frontend/components/common/Link', () => ({
    __esModule: true,
    default: ({ children, ...props }) => {
        mockLink(props);

        return (
            <div data-tid='link' {...props}>
                <span>{children}</span>
            </div>
        );
    },
}));

jest.mock('frontend/utils/touristTax.utils', () => ({
    __esModule: true,
    formatMoneyWithTouristTax: jest.fn().mockReturnValue('£150'),
}));

let mockStores;
let mockProps;

const createProps = (): ILivePriceProps => ({
    livePrice: { pricePP: 100, price: 200, touristTaxPP: 50, searchCriteria: { duration: 7 } } as Nullable<ILivePrice>,
    hasChevronIcon: false,
    isLink: false,
    isHolidaysResultButtonEnabled: false,
    isNumberOfNightsLabelsEnabled: false,
    hasGenericTaxTooltip: false,
});

describe('<LivePrice />', () => {
    beforeEach(() => {
        mockProps = createProps();
        mockStores = createMockStores({
            routerStore: { searchResultsUrl: jest.fn(query => `search?${query}`) },
            queryParamStore: { buildSearchQueryByLivePrice: jest.fn(() => 'query') },
            bookingStore: { setSearchValuesByQueryString: jest.fn() },
            layoutStore: { getFlexDays: jest.fn().mockReturnValue(3) },
        });
        mockUseHolidaysDestinationPageTypeName = undefined;
    });

    it('should NOT render when livePrice is NOT provided', () => {
        mockProps.livePrice = undefined;
        const { container } = render(<LivePrice {...mockProps} />);

        expect(container).toBeEmptyDOMElement();
    });

    it('should NOT render when pricePP is NOT provided', () => {
        mockProps.livePrice.pricePP = undefined;
        const { container } = render(<LivePrice {...mockProps} />);

        expect(container).toBeEmptyDOMElement();
    });

    describe('Render live price content', () => {
        beforeEach(() => {
            mockProps.isLink = false;
            mockProps.isHolidaysResultButtonEnabled = false;
        });

        it('should render price label with chevron icon, live price amount, before and after labels', () => {
            mockProps.hasChevronIcon = true;
            render(<LivePrice {...mockProps} />);

            expect(screen.getByTestId('price-label')).toBeInTheDocument();
            expect(screen.getByTestId('chevron-icon')).toBeInTheDocument();
            expect(screen.getByText('£150')).toBeInTheDocument();
            expect(screen.getByText('before')).toBeInTheDocument();
            expect(screen.getByText('after')).toBeInTheDocument();
            expect(mockPriceLabel).toHaveBeenCalledWith({
                priceDictionary: SitecoreDictionary.GlobalsPriceLabelsPerPersonFrom,
            });
            expect(screen.queryByTestId('tax-tooltip')).not.toBeInTheDocument();
        });

        it('should render price label with generic tourist tax', () => {
            mockStores.layoutStore.isTouristTaxEnabled = true;
            mockProps.hasGenericTaxTooltip = true;

            render(<LivePrice {...mockProps} />);

            expect(screen.getByText('£150')).toBeInTheDocument();
            expect(screen.getByTestId('tax-tooltip')).toBeInTheDocument();
        });

        it('should render price label without chevron icon when hasChevronIcon is false', () => {
            render(<LivePrice {...mockProps} />);

            expect(screen.getByTestId('price-label')).toBeInTheDocument();
            expect(screen.queryByTestId('chevron-icon')).not.toBeInTheDocument();
        });

        it('should render duration with GlobalsLabelsNightsPlural label when isNumberOfNightsLabelsEnabled and duration is NOT 1', () => {
            mockProps.isNumberOfNightsLabelsEnabled = true;
            render(<LivePrice {...mockProps} />);

            expect(screen.getByText('7')).toBeInTheDocument();
            expect(screen.getByText(SitecoreDictionary.GlobalsLabelsNightsPlural)).toBeInTheDocument();
        });

        it('should render duration with GlobalsLabelsNightsPlural label when isHolidaysResultButtonEnabled and duration is NOT 1', () => {
            mockProps.isHolidaysResultButtonEnabled = true;
            render(<LivePrice {...mockProps} />);

            expect(screen.getByText('7')).toBeInTheDocument();
            expect(screen.getByText(SitecoreDictionary.GlobalsLabelsNightsPlural)).toBeInTheDocument();
        });
    });

    describe('Render link', () => {
        beforeEach(() => {
            mockProps.isLink = true;
            mockProps.isHolidaysResultButtonEnabled = true;
        });

        it('should NOT render when availableOriginsSearchEnabled and isAvailableOriginsLoaded is false', () => {
            offersService.getAvailableOrigins = jest.fn().mockRejectedValue('');
            mockProps.availableOriginsSearchEnabled = true;
            const { container } = render(<LivePrice {...mockProps} />);

            expect(container).toBeEmptyDOMElement();
        });

        it('should render link with live-price-holiday-result-button and DestinationsButtonsViewHolidays text when isHolidaysResultButtonEnabled', () => {
            render(<LivePrice {...mockProps} />);

            expect(screen.getByTestId('live-price-holiday-result-button')).toBeInTheDocument();
            expect(screen.getByText(SitecoreDictionary.DestinationsLabelsViewHolidays)).toBeInTheDocument();
            expect(mockLink).toHaveBeenCalledWith({
                href: 'search?query',
                className: 'btn btn--large',
                'data-tid': 'live-price-holiday-result-button',
                onClick: expect.any(Function),
            });
        });

        it('should render link when isAvailableOriginsLoaded is true', () => {
            offersService.getAvailableOrigins = jest.fn().mockReturnValueOnce({ data: ['test'] });
            render(<LivePrice {...mockProps} />);

            expect(screen.getByTestId('live-price-holiday-result-button')).toBeInTheDocument();
        });

        it('should call setSearchValuesByQueryString on link click when isHolidaysResultButtonEnabled', async () => {
            render(<LivePrice {...mockProps} />);

            const link = screen.getByTestId('live-price-holiday-result-button');
            await userEvent.click(link);
            expect(mockStores.bookingStore.setSearchValuesByQueryString).toHaveBeenCalledWith('query');
        });

        it('should call setSearchValuesByQueryString on link click when isHolidaysResultButtonEnabled is false', async () => {
            mockProps.isHolidaysResultButtonEnabled = false;
            render(<LivePrice {...mockProps} />);

            const link = screen.getByTestId('link');

            await userEvent.click(link!);
            expect(mockStores.bookingStore.setSearchValuesByQueryString).toHaveBeenCalledWith('query');
        });

        it('should render link without live-price-holiday-result-button and DestinationsButtonsViewHolidays text when isHolidaysResultButtonEnabled is false', () => {
            mockProps.isHolidaysResultButtonEnabled = false;
            render(<LivePrice {...mockProps} />);

            expect(screen.queryByTestId('live-price-holiday-result-button')).not.toBeInTheDocument();
            expect(screen.queryByText(SitecoreDictionary.DestinationsLabelsViewHolidays)).not.toBeInTheDocument();
            expect(mockLink).toHaveBeenCalledWith({
                href: 'search?query',
                onClick: expect.any(Function),
            });
        });
    });

    describe('Link click tracking', () => {
        it('should call trackEventWithParams with expected params on link click when isHolidaysResultButtonEnabled is true and useHolidaysDestinationPageTypeName returns defined value', async () => {
            mockUseHolidaysDestinationPageTypeName = DestinationPageTemplateName.Resort;
            mockProps.isHolidaysResultButtonEnabled = true;
            render(<LivePrice {...mockProps} />);

            const link = screen.getByTestId('live-price-holiday-result-button');

            await userEvent.click(link);
            expect(mockStores.bookingStore.setSearchValuesByQueryString).toHaveBeenCalledWith('query');
            expect(mockStores.trackingStore.trackEventWithParams).toHaveBeenCalledWith(
                EventTypes.GenericEvent,
                {
                    eventAction: EventActions.HeroBannerButtonClick,
                    eventCategory: EventCategories.DestinationGuide,
                    eventLabel: 'View Holidays',
                    eventType: EventTypes.Interaction,
                },
                {
                    genericValue1: mockUseHolidaysDestinationPageTypeName,
                    genericValue2: null,
                    genericValue3: null,
                    genericValue4: null,
                    destinationUrl: mockStores.layoutStore.sitePath + 'search?query',
                },
            );
        });

        it('should NOT call trackEventWithParams on link click when isHolidaysResultButtonEnabled is true and useHolidaysDestinationPageTypeName returns undefined', async () => {
            mockProps.isHolidaysResultButtonEnabled = true;
            render(<LivePrice {...mockProps} />);

            const link = screen.getByTestId('live-price-holiday-result-button');

            await userEvent.click(link);
            expect(mockStores.trackingStore.trackEventWithParams).not.toHaveBeenCalled();
        });

        it('should NOT call trackEventWithParams on link click when isHolidaysResultButtonEnabled is false', async () => {
            mockProps.isLink = true;
            const { container } = render(<LivePrice {...mockProps} />);

            const link = container.querySelector('.live-price');

            await userEvent.click(link!);
            expect(mockStores.trackingStore.trackEventWithParams).not.toHaveBeenCalled();
        });
    });
});
