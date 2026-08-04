import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { createMockStores, mockLivePrice } from 'frontend/__mocks__';
import { DestinationPageTemplateName } from 'frontend/hooks/useHolidaysDestinationPageTypeName';
import { mockSitecoreField } from 'frontend/utils/tests.utils';
import { EventTypes } from 'models/enum/tracking/EventTypes';
import { EventActions, EventCategories } from 'models/enum/tracking/GenericEventParams';
import ViewHolidaysResults, {
    IViewHolidaysResultsProps,
    VIEW_HOLIDAYS_RESULTS_CTA_ID,
} from 'frontend/components/renderings/ViewHolidaysResults/ViewHolidaysResults';

jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useContext: () => mockStores,
}));

let mockUseHolidaysDestinationPageTypeName: DestinationPageTemplateName | undefined;

jest.mock('frontend/utils/livePrice.utils', () => ({
    getCheapestLivePrice: jest.fn().mockReturnValue(mockLivePrice),
    getLivePriceNumberOfNightsLabel: jest.fn(),
}));

jest.mock('frontend/hooks/useHolidaysDestinationPageTypeName', () => ({
    ...jest.requireActual('frontend/hooks/useHolidaysDestinationPageTypeName'),
    __esModule: true,
    default: () => mockUseHolidaysDestinationPageTypeName,
}));

jest.mock('frontend/components/common/RichTextWithLinks', () => ({
    __esModule: true,
    default: ({ field }) => (
        <div>
            RichTextWithLinks <span>{field?.value}</span>
        </div>
    ),
}));

jest.mock('frontend/components/common/RouterLink', () => ({ onClick, children, dataId }) => (
    <a data-tid={dataId} onClick={onClick}>
        {children}
    </a>
));

jest.mock('frontend/components/common/TouristTaxGenericTooltip/TouristTaxGenericTooltip', () => ({
    __esModule: true,
    TouristTaxGenericTooltip: ({ children }) => <div data-tid='tax-tooltip'>{children}</div>,
}));

const mockPriceLabelProps = jest.fn();
jest.mock('frontend/components/common/PriceLabel/PriceLabel', () => ({
    __esModule: true,
    default: ({ wrapPrice, ...props }) => {
        mockPriceLabelProps(props);

        return <div>{wrapPrice('price')}</div>;
    },
}));

const mockFormatMoneyWithTouristTax = jest.fn();
jest.mock('frontend/utils/touristTax.utils', () => ({
    __esModule: true,
    formatMoneyWithTouristTax: (...params) => mockFormatMoneyWithTouristTax(...params),
    isPriceWithTouristTaxValid: jest.fn().mockReturnValue(true),
}));

const mockGetRelatedDestinationsCodes = jest.fn();
jest.mock('frontend/utils/search/search.utils', () => ({
    __esModule: true,
    getRelatedDestinationsCodes: props => mockGetRelatedDestinationsCodes(props),
}));

const createProps = (): IViewHolidaysResultsProps => ({
    fields: {
        Text: mockSitecoreField('{country}'),
        LinkName: mockSitecoreField('name of link'),
        EnglishTracking: mockSitecoreField('EnglishTracking {country}'),
    },
});

let mockProps;
let mockStores;

describe('<ViewHolidaysResults />', () => {
    beforeEach(() => {
        mockProps = createProps();
        mockStores = createMockStores({
            layoutStore: {
                destinationCode: 'ES',
                isEditMode: false,
                isVirtualRegionOrResortPage: true,
                isViewHolidaysResultsLivePriceEnabled: true,
                isTouristTaxEnabled: false,
                layoutName: 'Test Country Eng',
                route: {
                    fields: {
                        Name: {
                            value: 'Test Country',
                        },
                    },
                },
                getSettingAsNumber: jest.fn(),
                pageFields: {
                    Resorts: [],
                    Regions: [],
                },
            },
            hotelsStore: {
                getLivePrice: jest.fn().mockReturnValue(mockLivePrice),
            },
            routerStore: {
                searchResultsUrl: jest.fn(query => `search?${query}`),
            },
            queryParamStore: {
                buildSearchQueryByLivePrice: jest.fn(() => 'query'),
            },
            bookingStore: {
                setSearchValuesByQueryString: jest.fn(),
            },
            marketStore: {
                formatMoney: jest.fn(),
            },
        });

        mockUseHolidaysDestinationPageTypeName = undefined;
        mockFormatMoneyWithTouristTax.mockReturnValue('£500');
        mockGetRelatedDestinationsCodes.mockReturnValue(['relatedRegionsCodes']);
    });

    it('Should standard render', async () => {
        render(<ViewHolidaysResults {...mockProps} />);

        await waitFor(() => expect(screen.getByTestId(VIEW_HOLIDAYS_RESULTS_CTA_ID)).toBeInTheDocument());

        expect(mockPriceLabelProps).toHaveBeenCalledWith({
            className: 'description',
            price: '£500',
            priceDictionary: 'Globals.PriceLabels.PerPerson',
            tag: 'strong',
        });
        expect(mockFormatMoneyWithTouristTax).toHaveBeenCalledWith(
            500,
            450,
            false,
            mockStores.marketStore.formatMoney,
            {
                currency: 'GBP',
                maximumFractionDigits: 0,
            },
        );
        expect(mockGetRelatedDestinationsCodes).toHaveBeenCalledWith({ Resorts: [], Regions: [] });
    });

    it('should render tax price tooltip when isTouristTaxEnabled is true', () => {
        mockStores.layoutStore.isTouristTaxEnabled = true;

        render(<ViewHolidaysResults {...mockProps} />);

        expect(screen.getByTestId('tax-tooltip')).toHaveTextContent('price');
        expect(mockFormatMoneyWithTouristTax).toHaveBeenCalledWith(500, 450, true, mockStores.marketStore.formatMoney, {
            currency: 'GBP',
            maximumFractionDigits: 0,
        });
    });

    describe('Link click', () => {
        it('Should call setSearchValuesByQueryString and should not call trackEventWithParams after click on link when useHolidaysDestinationPageTypeName returns undefined', async () => {
            render(<ViewHolidaysResults {...mockProps} />);

            await waitFor(() => expect(screen.getByTestId(VIEW_HOLIDAYS_RESULTS_CTA_ID)).toBeInTheDocument());
            await userEvent.click(screen.getByTestId(VIEW_HOLIDAYS_RESULTS_CTA_ID));
            expect(mockStores.bookingStore.setSearchValuesByQueryString).toHaveBeenCalledWith('query');
            expect(mockStores.trackingStore.trackEventWithParams).not.toHaveBeenCalled();
        });

        it('Should call setSearchValuesByQueryString & trackEventWithParams after click on link when useHolidaysDestinationPageTypeName returns defined value', async () => {
            mockUseHolidaysDestinationPageTypeName = DestinationPageTemplateName.Resort;
            const { container } = render(<ViewHolidaysResults {...mockProps} />);

            await waitFor(() =>
                expect(container.querySelectorAll(`a[data-tid='${VIEW_HOLIDAYS_RESULTS_CTA_ID}']`)).toHaveLength(1),
            );
            await userEvent.click(screen.getByTestId(VIEW_HOLIDAYS_RESULTS_CTA_ID));
            expect(mockStores.bookingStore.setSearchValuesByQueryString).toHaveBeenCalledWith('query');
            expect(mockStores.trackingStore.trackEventWithParams).toHaveBeenCalledWith(
                EventTypes.GenericEvent,
                {
                    eventAction: EventActions.ButtonClick,
                    eventCategory: EventCategories.DestinationGuide,
                    eventLabel: 'EnglishTracking ' + mockStores.layoutStore.layoutName,
                    eventType: EventTypes.Interaction,
                },
                {
                    genericValue1: mockUseHolidaysDestinationPageTypeName,
                    genericValue2: null,
                    genericValue3: '1',
                    genericValue4: null,
                    destinationUrl: mockStores.layoutStore.sitePath + 'search?query',
                },
            );
        });

        it('Should call trackEventWithParams with genericValue3 equal to the order of the button that was clicked', async () => {
            mockUseHolidaysDestinationPageTypeName = DestinationPageTemplateName.Resort;
            const { container } = render(
                <>
                    <ViewHolidaysResults {...mockProps} />
                    <ViewHolidaysResults {...mockProps} />
                    <ViewHolidaysResults {...mockProps} />
                </>,
            );

            await waitFor(() =>
                expect(container.querySelectorAll(`a[data-tid='${VIEW_HOLIDAYS_RESULTS_CTA_ID}']`)).toHaveLength(3),
            );
            await userEvent.click(screen.getAllByTestId(VIEW_HOLIDAYS_RESULTS_CTA_ID)[2]);
            expect(mockStores.trackingStore.trackEventWithParams).toHaveBeenCalledWith(
                expect.any(String),
                expect.any(Object),
                expect.objectContaining({
                    genericValue3: '3',
                }),
            );
        });
    });

    it('should NOT render without fields', async () => {
        delete mockProps.fields;

        render(<ViewHolidaysResults {...mockProps} />);

        await waitFor(() => expect(screen.queryByTestId(VIEW_HOLIDAYS_RESULTS_CTA_ID)).not.toBeInTheDocument());
    });

    it('should NOT render if isViewHolidaysResultsLivePriceEnabled is disabled', async () => {
        mockStores.layoutStore.isViewHolidaysResultsLivePriceEnabled = false;

        render(<ViewHolidaysResults {...mockProps} />);

        await waitFor(() => expect(screen.queryByTestId(VIEW_HOLIDAYS_RESULTS_CTA_ID)).not.toBeInTheDocument());
    });

    it('should render with the correct country value', async () => {
        render(<ViewHolidaysResults {...mockProps} />);

        await waitFor(() =>
            expect(screen.getByText(mockStores.layoutStore.route.fields.Name.value)).toBeInTheDocument(),
        );
    });

    it('should render RichTextWithLinks without country value', async () => {
        delete mockStores.layoutStore.route;

        render(<ViewHolidaysResults {...mockProps} />);

        await waitFor(() => expect(screen.getByText('RichTextWithLinks')).toBeInTheDocument());
    });

    describe('loadPrices', () => {
        it('should NOT load LoadPrices when isViewHolidaysResultsLivePriceEnabled is false', () => {
            mockStores.layoutStore.isViewHolidaysResultsLivePriceEnabled = false;

            render(<ViewHolidaysResults {...mockProps} />);
            expect(mockStores.hotelsStore.getLivePrice).not.toBeCalled();
        });

        it('should load LoadPrices when isViewHolidaysResultsLivePriceEnabled is true', () => {
            render(<ViewHolidaysResults {...mockProps} />);

            expect(mockStores.hotelsStore.getLivePrice).toBeCalled();
        });
    });
});
