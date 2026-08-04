import React from 'react';
import { SwipeableHandlers } from 'react-swipeable';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { Tokens } from 'code/tokens';
import { createMockStores, mockHotel, mockTransfer } from 'frontend/__mocks__';
import { mockedOffer } from 'frontend/__mocks__/offer';
import { mockedTransport } from 'frontend/__mocks__/transport';
import { mockReplaceToken, mockTokenizer } from 'frontend/__mocks__/utils/tokenizer';
import * as trackingUtils from 'frontend/hooks/useCarouselTracking/useCarouselTracking';
import * as discountUtils from 'frontend/utils/discount.utils';
import * as nightsUtils from 'frontend/utils/freeNights.utils';
import * as utils from 'frontend/utils/luggage.utils';
import * as offerUtils from 'frontend/utils/offer.utils';
import { PackageIconTypes } from 'models/enum/PackageIconTypes';
import { QueryParamName } from 'models/enum/QueryParamName';
import SitecoreDictionary from 'models/enum/SitecoreDictionary';
import SiteSettings from 'models/enum/SiteSettings';
import { PillSizeVariants } from 'frontend/components/common/Pills/PillWithVariants/PillSizeVariants';

import { CarouselOfferCard, ICarouselOfferCardProps } from './CarouselOfferCard';

let mockIsTradeStore = false;
jest.mock('frontend/store/tradePortal', () => ({
    isTradeStore: jest.fn(() => mockIsTradeStore),
}));

jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useContext: () => mockStores,
}));

jest.mock('frontend/hooks/usePriceLabels', () =>
    jest.fn(() => ({
        labelBeforePrice: '',
        labelAfterPrice: ' pp',
    })),
);

const mockDiscountPercentagePill = jest.fn();
jest.mock('frontend/components/common/Pills/DiscountPercentagePill/DiscountPercentagePill', () => ({
    __esModule: true,
    default: props => {
        mockDiscountPercentagePill(props);

        return <div data-tid='discount-percentage-pill' />;
    },
}));

const mockHolidayFlightDetails = jest.fn();
jest.mock('frontend/components/common/HolidayFlightDetails', () => ({
    __esModule: true,
    default: props => {
        mockHolidayFlightDetails(props);

        return <div data-tid='holiday-flight-details' />;
    },
}));

jest.mock('frontend/components/common/Link', () => ({
    __esModule: true,
    default: ({ children, ...props }) => (
        <div data-tid='link' {...props}>
            {children}
        </div>
    ),
}));

jest.mock('frontend/components/common/StarRating', () => ({
    __esModule: true,
    default: () => <div data-tid='star-rating' />,
}));

jest.mock('frontend/components/renderings/HotelDetails/components/TripadvisorInfo', () => ({
    __esModule: true,
    default: () => <div data-tid='tripadvisor-info' />,
}));

const mockCarouselOfferPriceProps = jest.fn();
jest.mock('./CarouselOfferPrice', () => ({
    __esModule: true,
    default: ({ onClickViewHoliday, ...restProps }) => {
        mockCarouselOfferPriceProps(restProps);

        return <div data-tid='carousel-offer-price' onClick={onClickViewHoliday} />;
    },
}));

const mockOfferCardSlider = jest.fn();
jest.mock('frontend/components/common/OfferCardSlider/OfferCardSlider', () => ({
    __esModule: true,
    default: props => {
        mockOfferCardSlider(props);

        return <div data-tid='offer-card-slider' />;
    },
}));

jest.mock('./OfferKeySellingPoints', () => ({
    __esModule: true,
    default: ({ handleCalloutHoverState }) => (
        <div data-tid='offer-key-selling-points' onClick={() => handleCalloutHoverState(true)} />
    ),
}));

const mockFreeForKidsPill = jest.fn();
jest.mock('frontend/components/common/Pills/FreeForKidsPill/FreeForKidsPill', () => ({
    __esModule: true,
    default: props => {
        mockFreeForKidsPill(props);

        return <div data-tid='free-for-kids-pill' />;
    },
}));

const mockHotelDeposit = jest.fn();
jest.mock('frontend/components/renderings/SearchResults/components/HotelDeposit', () => ({
    __esModule: true,
    default: props => {
        mockHotelDeposit(props);

        return <div data-tid='hotel-deposit' />;
    },
}));

const mockHotelDiscountPill = jest.fn();
jest.mock('frontend/components/common/Pills/HotelDiscountPill/HotelDiscountPill', () => ({
    __esModule: true,
    default: props => {
        mockHotelDiscountPill(props);

        return <div data-tid='hotel-discount-pill' />;
    },
}));

const mockFreeNightsIncludedPill = jest.fn();
jest.mock('frontend/components/common/Pills/FreeNightsIncludedPill/FreeNightsIncludedPill', () => ({
    __esModule: true,
    default: props => {
        mockFreeNightsIncludedPill(props);

        return <div data-tid='free-nights-included-pill' />;
    },
}));

jest.mock('frontend/components/renderings/Shortlists/components/ShortlistButton/ShortlistButton', () => () => (
    <div data-tid='shortlist-button' />
));

const mockSponsoredBadgeComponent = jest.fn();
jest.mock('frontend/components/common/SponsoredBadge', () => ({
    __esModule: true,
    default: props => {
        mockSponsoredBadgeComponent(props);

        return <div data-tid='sponsored-badge' />;
    },
}));

const mockPillComponent = jest.fn();
jest.mock('frontend/components/common/Pills/Pill/Pill', () => ({
    __esModule: true,
    default: props => {
        mockPillComponent(props);

        return <div data-tid={props.dataTid} />;
    },
}));

const mockPromoBadge = jest.fn();
jest.mock('frontend/components/common/PromoBadge', () => ({
    __esModule: true,
    default: props => {
        mockPromoBadge(props);

        return <div data-tid='promo-badge' />;
    },
}));

jest.spyOn(utils, 'getLuggageAmount').mockReturnValue(2);
jest.mock('frontend/hooks/useLuggageTextFromOfferAndFields', () => ({
    useLuggageTextFromOfferAndFields: jest.fn().mockReturnValue('luggage text'),
}));

jest.spyOn(trackingUtils, 'default').mockReturnValue({
    swipeHandlers: {} as SwipeableHandlers,
    handleSlide: jest.fn(),
    onCarouselSync: jest.fn(),
    trackFullScreenClose: jest.fn(),
    trackFullScreenOpen: jest.fn(),
    trackThumbnailClick: jest.fn(),
});

jest.mock('frontend/utils/tokenizer', () => ({
    __esModule: true,
    Tokenizer: mockTokenizer,
}));

const createStores = () =>
    createMockStores({
        bookingStore: {
            clearAncillaries: jest.fn(),
        },
        layoutStore: {
            currentPath: '',
            isApplySpecialFilter: jest.fn(),
            isPillVisible: jest.fn(),
            isPromoPage: false,
            isWeLovePillEnabled: false,
            pageName: '',
            isPricesHidden: false,
        },
        routerStore: {
            hotelDetailsBrowseUrl: jest.fn().mockReturnValue(''),
            hotelDetailsUrl: jest.fn(),
        },
        searchStore: {
            page: 1,
            take: 0,
        },
        queryParamStore: {
            buildBD4HotelParam: jest.fn(),
            buildHotelDetailsQuery: jest.fn(),
            buildQuery: jest.fn(),
            emptyAncillariesParams: {
                [QueryParamName.SelectedSeats]: '',
            },
        },
        shortlistStore: {
            isShortlistEnabled: true,
        },
        marketStore: {
            currency: 'GBP',
            formatMoney: jest.fn().mockReturnValue('£50'),
        },
    });

const createProps = (): ICarouselOfferCardProps => ({
    fallbackImage: '',
    offer: { ...mockedOffer, date: '2024-01-01' },
    offerIndex: 1,
    onSelect: jest.fn(),
});

let mockProps;
let mockStores = createStores();

describe('<CarouselOfferCard />', () => {
    beforeEach(() => {
        mockProps = createProps();
        mockStores = createStores();
        mockIsTradeStore = false;
    });

    it('should render default', () => {
        render(<CarouselOfferCard {...mockProps} />);

        expect(screen.getByTestId('offer-card-slider')).toBeInTheDocument();
        expect(screen.getByTestId('carousel-offer-price')).toBeInTheDocument();
        expect(screen.getByTestId('offer-key-selling-points')).toBeInTheDocument();
        expect(screen.getByTestId('holiday-flight-details')).toBeInTheDocument();
        expect(screen.getByTestId('star-rating')).toBeInTheDocument();
        expect(screen.getByTestId('link')).toBeInTheDocument();
        expect(screen.getByTestId('tripadvisor-info')).toBeInTheDocument();

        expect(mockStores.queryParamStore.buildHotelDetailsQuery).toHaveBeenCalledWith(mockProps.offer, {
            dtransfer: 'TRANSFER_CODE',
            from: '01-01-2024',
            ss: '',
            to: '08-01-2024',
            transfer: 'TRANSFER_CODE',
        });

        expect(mockHolidayFlightDetails).toHaveBeenCalledWith({
            night: 7,
            routeDep: mockedTransport.routes[0],
            routeArr: mockedTransport.routes[1],
            luggageCount: 2,
            luggageText: 'luggage text',
            transfer: mockTransfer,
            packageIcons: mockHotel.theme.packageIcons,
            isParentOffer: undefined,
            isRecommendedOffer: false,
            offer: mockProps.offer,
        });

        expect(mockOfferCardSlider).toHaveBeenCalledWith({
            fallbackImage: '',
            images: mockProps.offer.hotel.images,
            onArrowClick: undefined,
            showIndex: true,
            trackingHandlers: { handleSlide: expect.any(Function), swipeHandlers: {} },
            videoIndex: 1,
            videoPlaceholder: '',
            youtubeVideoId: '',
            cloudinaryVideoSrc: '',
        });

        expect(screen.getByTestId('hotel-card')).not.toHaveClass('sponsored');
        expect(screen.getByTestId('hotel-card')).not.toHaveClass('gridCard');
    });

    it('should apply grid class when isGrid props is true', () => {
        mockProps.isGrid = true;

        render(<CarouselOfferCard {...mockProps} />);

        expect(screen.getByTestId('hotel-card')).toHaveClass('gridCard');
    });

    describe('PromoBadge', () => {
        it('should render PromoBadge with tokenized text when promotion has discountAmountPerBooking', () => {
            const mockGetDiscount = jest.spyOn(discountUtils, 'getDiscount');

            mockReplaceToken.mockReturnValue('Discount £50');
            mockGetDiscount.mockReturnValue('£50');

            mockProps.offer.promotion = {
                cardDescription: 'Discount {discount}',
                discountAmountPerBooking: 50,
            };

            render(<CarouselOfferCard {...mockProps} />);

            expect(mockGetDiscount).toHaveBeenCalledWith(
                mockProps.offer.promotion,
                'GBP',
                mockStores.marketStore.formatMoney,
            );

            expect(mockReplaceToken).toHaveBeenCalledWith('Discount {discount}', Tokens.Discount, '£50');

            expect(mockPromoBadge).toHaveBeenCalledWith({
                text: 'Discount £50',
            });
        });

        it('should render PromoBadge with tokenized text when promotion has percentageDiscountPerBooking', () => {
            const mockGetDiscount = jest.spyOn(discountUtils, 'getDiscount');

            mockReplaceToken.mockReturnValue('Discount 15%');
            mockGetDiscount.mockReturnValue('15%');

            mockProps.offer.promotion = {
                cardDescription: 'Discount {discount}',
                percentageDiscountPerBooking: 0.15,
            };

            render(<CarouselOfferCard {...mockProps} />);

            expect(mockGetDiscount).toHaveBeenCalledWith(
                mockProps.offer.promotion,
                'GBP',
                mockStores.marketStore.formatMoney,
            );

            expect(mockReplaceToken).toHaveBeenCalledWith('Discount {discount}', Tokens.Discount, '15%');

            expect(mockPromoBadge).toHaveBeenCalledWith({
                text: 'Discount 15%',
            });
        });

        describe('getDiscount behavior', () => {
            it('should render PromoBadge with discount token when discountAmountPerBooking exists', () => {
                const mockGetDiscount = jest.spyOn(discountUtils, 'getDiscount').mockReturnValue('£100');
                const mockGetDiscountPerPerson = jest.spyOn(discountUtils, 'getDiscountPerPerson');

                mockReplaceToken.mockReturnValue('Save £100 on your booking');

                mockProps.offer.promotion = {
                    cardDescription: 'Save {discount} on your booking',
                    discountAmountPerBooking: 100,
                };

                render(<CarouselOfferCard {...mockProps} />);

                expect(mockGetDiscount).toHaveBeenCalledWith(
                    mockProps.offer.promotion,
                    'GBP',
                    mockStores.marketStore.formatMoney,
                );
                expect(mockGetDiscountPerPerson).not.toHaveBeenCalled();

                expect(mockPromoBadge).toHaveBeenCalledWith({
                    text: 'Save £100 on your booking',
                });
            });

            it('should render PromoBadge with discount token when percentageDiscountPerBooking exists', () => {
                const mockGetDiscount = jest.spyOn(discountUtils, 'getDiscount').mockReturnValue('20%');
                const mockGetDiscountPerPerson = jest.spyOn(discountUtils, 'getDiscountPerPerson');

                mockReplaceToken.mockReturnValue('Get 20% off your holiday');

                mockProps.offer.promotion = {
                    cardDescription: 'Get {discount} off your holiday',
                    percentageDiscountPerBooking: 0.2,
                };

                render(<CarouselOfferCard {...mockProps} />);

                expect(mockGetDiscount).toHaveBeenCalledWith(
                    mockProps.offer.promotion,
                    'GBP',
                    mockStores.marketStore.formatMoney,
                );
                expect(mockGetDiscountPerPerson).not.toHaveBeenCalled();

                expect(mockPromoBadge).toHaveBeenCalledWith({
                    text: 'Get 20% off your holiday',
                });
            });
        });

        describe('getDiscountPerPerson behavior', () => {
            it('should render PromoBadge with discountPerPerson token when discountAmountPerPerson exists', () => {
                const mockGetDiscount = jest.spyOn(discountUtils, 'getDiscount');
                const mockGetDiscountPerPerson = jest
                    .spyOn(discountUtils, 'getDiscountPerPerson')
                    .mockReturnValue('£25');

                mockReplaceToken.mockReturnValue('Save £25 per person');

                mockProps.offer.promotion = {
                    cardDescription: 'Save {discountPerPerson} per person',
                    discountAmountPerPerson: 25,
                };

                render(<CarouselOfferCard {...mockProps} />);

                expect(mockGetDiscount).not.toHaveBeenCalled();
                expect(mockGetDiscountPerPerson).toHaveBeenCalledWith(
                    mockProps.offer.promotion,
                    'GBP',
                    expect.any(Function),
                    '',
                    ' pp',
                );

                expect(mockPromoBadge).toHaveBeenCalledWith({
                    text: 'Save £25 per person',
                });
            });

            it('should render PromoBadge with discountPerPerson token when discountPercentagePerPerson exists', () => {
                const mockGetDiscount = jest.spyOn(discountUtils, 'getDiscount');
                const mockGetDiscountPerPerson = jest
                    .spyOn(discountUtils, 'getDiscountPerPerson')
                    .mockReturnValue('15%');

                mockReplaceToken.mockReturnValue('Save 15% per person');

                mockProps.offer.promotion = {
                    cardDescription: 'Save {discountPerPerson} per person',
                    discountPercentagePerPerson: 0.15,
                };

                render(<CarouselOfferCard {...mockProps} />);

                expect(mockGetDiscount).not.toHaveBeenCalled();
                expect(mockGetDiscountPerPerson).toHaveBeenCalledWith(
                    mockProps.offer.promotion,
                    'GBP',
                    expect.any(Function),
                    '',
                    ' pp',
                );

                expect(mockPromoBadge).toHaveBeenCalledWith({
                    text: 'Save 15% per person',
                });
            });

            it('should prioritize discountAmountPerPerson when both per-person fields are provided', () => {
                const mockGetDiscountPerPerson = jest
                    .spyOn(discountUtils, 'getDiscountPerPerson')
                    .mockReturnValue('£50');

                mockReplaceToken.mockReturnValue('Save £50 per person');

                mockProps.offer.promotion = {
                    cardDescription: 'Save {discountPerPerson} per person',
                    discountAmountPerPerson: 50,
                    discountPercentagePerPerson: 0.2,
                };

                render(<CarouselOfferCard {...mockProps} />);

                expect(mockGetDiscountPerPerson).toHaveBeenCalledWith(
                    mockProps.offer.promotion,
                    'GBP',
                    expect.any(Function),
                    '',
                    ' pp',
                );

                expect(mockPromoBadge).toHaveBeenCalledWith({
                    text: 'Save £50 per person',
                });
            });
        });

        describe('Combined discount scenarios', () => {
            it('should render PromoBadge with both discount and discountPerPerson tokens', () => {
                const mockGetDiscount = jest.spyOn(discountUtils, 'getDiscount').mockReturnValue('£100');
                const mockGetDiscountPerPerson = jest
                    .spyOn(discountUtils, 'getDiscountPerPerson')
                    .mockReturnValue('£25');

                mockReplaceToken
                    .mockReturnValueOnce('Total discount £100, save £25 per person')
                    .mockReturnValueOnce('Total discount £100, save £25 per person');

                mockProps.offer.promotion = {
                    cardDescription: 'Total discount {discount}, save {discountPerPerson} per person',
                    discountAmountPerBooking: 100,
                    discountAmountPerPerson: 25,
                };

                render(<CarouselOfferCard {...mockProps} />);

                expect(mockGetDiscount).toHaveBeenCalledWith(
                    mockProps.offer.promotion,
                    'GBP',
                    mockStores.marketStore.formatMoney,
                );
                expect(mockGetDiscountPerPerson).toHaveBeenCalledWith(
                    mockProps.offer.promotion,
                    'GBP',
                    expect.any(Function),
                    '',
                    ' pp',
                );

                expect(mockPromoBadge).toHaveBeenCalledWith({
                    text: 'Total discount £100, save £25 per person',
                });
            });
        });

        describe('No discount scenarios', () => {
            it('should render PromoBadge with original cardDescription when promotion has no discount', () => {
                const mockGetDiscount = jest.spyOn(discountUtils, 'getDiscount');
                const mockGetDiscountPerPerson = jest.spyOn(discountUtils, 'getDiscountPerPerson');

                mockProps.offer.promotion = {
                    cardDescription: 'Special offer',
                };

                render(<CarouselOfferCard {...mockProps} />);

                expect(mockGetDiscount).not.toHaveBeenCalled();
                expect(mockGetDiscountPerPerson).not.toHaveBeenCalled();

                expect(mockPromoBadge).toHaveBeenCalledWith({
                    text: 'Special offer',
                });
            });

            it('should render PromoBadge with undefined text when promotion is not defined', () => {
                const mockGetDiscount = jest.spyOn(discountUtils, 'getDiscount');
                const mockGetDiscountPerPerson = jest.spyOn(discountUtils, 'getDiscountPerPerson');

                mockProps.offer.promotion = undefined;

                render(<CarouselOfferCard {...mockProps} />);

                expect(mockGetDiscount).not.toHaveBeenCalled();
                expect(mockGetDiscountPerPerson).not.toHaveBeenCalled();
                expect(mockPromoBadge).toHaveBeenCalledWith({
                    text: undefined,
                });
            });
        });
    });

    describe('HolidayFlightDetails props', () => {
        it('should render HolidayFlightDetails with packageIcons from offer.accom.theme when they are defined', () => {
            mockProps.offer.accom.theme = {
                ...mockProps.offer.accom.theme,
                packageIcons: [
                    {
                        key: PackageIconTypes.Hotel,
                        name: 'Beach Package',
                        iconUrl: 'beach_icon_url',
                    },
                ],
            };

            render(<CarouselOfferCard {...mockProps} />);

            expect(mockHolidayFlightDetails).toHaveBeenCalledWith(
                expect.objectContaining({
                    packageIcons: mockProps.offer.accom.theme.packageIcons,
                }),
            );
        });

        it('should render HolidayFlightDetails without packageIcons when they are not defined in both offer.accom.theme and offer.hotel.theme', () => {
            mockProps.offer.accom.theme = {};
            mockProps.offer.hotel.theme = {};

            render(<CarouselOfferCard {...mockProps} />);

            expect(mockHolidayFlightDetails).toHaveBeenCalledWith(
                expect.objectContaining({
                    packageIcons: undefined,
                }),
            );
        });

        it('should render HolidayFlightDetails with luggageCount from getLuggageAmount', () => {
            mockProps.offer.extraLuggageInfo = { items: [1, 2] };

            render(<CarouselOfferCard {...mockProps} />);

            expect(mockHolidayFlightDetails).toHaveBeenCalledWith(
                expect.objectContaining({
                    luggageCount: 2,
                    luggageText: 'luggage text',
                }),
            );
        });
    });

    describe('SuperDeal Label', () => {
        it("should NOT show label if it's recommendation card", () => {
            mockProps.recommendedType = true;

            render(<CarouselOfferCard {...mockProps} />);

            expect(screen.queryByText(SitecoreDictionary.SearchResultsLabelsSuperDeal)).not.toBeInTheDocument();
        });

        it("should NOT show label if it's a Promo Page with special filter", () => {
            mockStores.layoutStore.isPromoPage = true;
            mockStores.layoutStore.pageName = 'Test Promo';
            mockStores.layoutStore.isApplySpecialFilter = jest.fn().mockReturnValue(true);

            render(<CarouselOfferCard {...mockProps} />);

            expect(mockStores.layoutStore.isApplySpecialFilter).toBeCalledWith(
                SiteSettings.HideSuperDeals,
                'Test Promo',
            );
            expect(screen.queryByText(SitecoreDictionary.SearchResultsLabelsSuperDeal)).not.toBeInTheDocument();
        });

        it("should NOT show label if offer doesn't have DistressedFlights", () => {
            mockProps.offer.hasDistressedFlights = false;

            render(<CarouselOfferCard {...mockProps} />);

            expect(screen.queryByText(SitecoreDictionary.SearchResultsLabelsSuperDeal)).not.toBeInTheDocument();
        });

        it('should show label if offer has DistressedFlights and country is NOT excluded on sitecore', () => {
            mockProps.offer.hasDistressedFlights = true;
            mockProps.offer.hotel.country = { code: 'ES' };
            mockStores.layoutStore.isPillVisible = jest.fn().mockReturnValue(true);

            render(<CarouselOfferCard {...mockProps} />);

            expect(mockStores.layoutStore.isPillVisible).toBeCalledWith(SiteSettings.SuperDealsLabel, 'ES');
            expect(screen.getByText(SitecoreDictionary.SearchResultsLabelsSuperDeal)).toBeInTheDocument();
        });

        it('should NOT show label if offer has DistressedFlights, but country is excluded on sitecore', () => {
            mockProps.offer.hasDistressedFlights = true;
            mockProps.offer.hotel.country = { code: 'ES' };
            mockStores.layoutStore.isPillVisible = jest.fn().mockReturnValue(false);

            render(<CarouselOfferCard {...mockProps} />);

            expect(mockStores.layoutStore.isPillVisible).toBeCalledWith(SiteSettings.SuperDealsLabel, 'ES');
            expect(screen.queryByText(SitecoreDictionary.SearchResultsLabelsSuperDeal)).not.toBeInTheDocument();
        });
    });

    describe('onClickSelect function', () => {
        beforeEach(() => {
            mockProps.offer.hotel = { name: 'Andropolis Strigalinus Royale Resort Golf and SPA', url: '/url' };
        });

        it('should call onSelect prop function when link is clicked', async () => {
            const hotelBrowseUrl = '/example-url';
            mockStores.routerStore.hotelDetailsBrowseUrl = jest.fn().mockReturnValue(hotelBrowseUrl);
            render(<CarouselOfferCard {...mockProps} />);

            await userEvent.click(screen.getByTestId('hotel-link'));

            expect(mockStores.bookingStore.clearAncillaries).toHaveBeenCalled();
            expect(mockProps.onSelect).toHaveBeenCalledWith(mockProps.offer, hotelBrowseUrl);
        });

        it('should call onSelect prop function when CarouselOfferPrice is clicked', async () => {
            const hotelUrl = '/example-url?query=1';
            mockStores.routerStore.hotelDetailsUrl = jest.fn().mockReturnValue(hotelUrl);
            render(<CarouselOfferCard {...mockProps} />);

            await userEvent.click(screen.getByTestId('carousel-offer-price'));

            expect(mockStores.bookingStore.clearAncillaries).toHaveBeenCalled();
            expect(mockProps.onSelect).toHaveBeenCalledWith(mockProps.offer, hotelUrl);
        });
    });

    describe('pills', () => {
        it('should render FreeForeKidsPill when isFreeForKids is true', () => {
            jest.spyOn(offerUtils, 'isFreeForKids').mockReturnValue(true);

            render(<CarouselOfferCard {...mockProps} />);

            expect(screen.getByTestId('free-for-kids-pill')).toBeInTheDocument();
            expect(mockFreeForKidsPill).toHaveBeenCalledWith({
                countryCode: mockProps.offer.hotel?.country.code,
                tooltipMessage: SitecoreDictionary.HolidayCardPromotionPillTooltipsFreeForKids,
            });
        });

        it('should NOT render FreeForeKidsPill when isFreeForKids is false', () => {
            jest.spyOn(offerUtils, 'isFreeForKids').mockReturnValue(false);

            render(<CarouselOfferCard {...mockProps} />);

            expect(screen.queryByTestId('free-for-kids-pill')).not.toBeInTheDocument();
        });

        it('should render HotelDeposit with HolidayCardPromotionPillTooltipsHotelDepositOneGuest when deposit > 1 and isPricePP is false', () => {
            mockProps.offer.deposit = 1;
            mockProps.offer.hotel = undefined;

            render(<CarouselOfferCard {...mockProps} />);

            expect(screen.getByTestId('hotel-deposit')).toBeInTheDocument();
            expect(mockHotelDeposit).toHaveBeenCalledWith({
                countryCode: '',
                offer: mockProps.offer,
                tooltipMessage: SitecoreDictionary.HolidayCardPromotionPillTooltipsHotelDepositOneGuest,
            });
        });

        it('should render HotelDeposit with HolidayCardPromotionPillTooltipsHotelDeposit when deposit > 0 and isPricePPShown is true', () => {
            mockProps.offer.deposit = 1;
            jest.spyOn(offerUtils, 'isPricePPShown').mockReturnValue(true);

            render(<CarouselOfferCard {...mockProps} />);

            expect(screen.getByTestId('hotel-deposit')).toBeInTheDocument();
            expect(mockHotelDeposit).toHaveBeenCalledWith({
                countryCode: mockProps.offer.hotel?.country.code,
                offer: mockProps.offer,
                tooltipMessage: SitecoreDictionary.HolidayCardPromotionPillTooltipsHotelDeposit,
            });
        });

        it('should NOT render HotelDeposit when deposit is 0', () => {
            render(<CarouselOfferCard {...mockProps} />);

            expect(screen.queryByTestId('hotel-deposit')).not.toBeInTheDocument();
        });

        it('should render HotelDiscountPill when discount > 1', () => {
            jest.spyOn(offerUtils, 'getTotalDiscount').mockReturnValue(1);

            render(<CarouselOfferCard {...mockProps} />);

            expect(screen.getByTestId('hotel-discount-pill')).toBeInTheDocument();
            expect(mockHotelDiscountPill).toHaveBeenCalledWith({
                amount: 1,
                countryCode: mockProps.offer.hotel?.country.code,
                currency: undefined,
                tooltipMessage: SitecoreDictionary.HolidayCardPromotionPillTooltipsDiscount,
            });
        });

        it('should NOT render HotelDiscountPill when discount is 0', () => {
            jest.spyOn(offerUtils, 'getTotalDiscount').mockReturnValue(0);

            render(<CarouselOfferCard {...mockProps} />);

            expect(screen.queryByTestId('hotel-discount-pill')).not.toBeInTheDocument();
        });

        it('should render FreeNightsIncludedPill', () => {
            jest.spyOn(nightsUtils, 'getFreeNightsIncludedInOffer').mockReturnValue(1);

            render(<CarouselOfferCard {...mockProps} />);

            expect(screen.getByTestId('free-nights-included-pill')).toBeInTheDocument();
            expect(mockFreeNightsIncludedPill).toHaveBeenCalledWith({ nights: 1 });
        });

        it('should set disabledOverflow style if OfferKeySellingPoints clicked', async () => {
            const { container } = render(<CarouselOfferCard {...mockProps} />);

            await userEvent.click(screen.getByTestId('offer-key-selling-points'));

            expect(container.querySelector('.disabledOverflow')).toBeInTheDocument();
        });

        it('should render Sponsored Pill and specific card class when booking has isSponsored = true property and displaySponsoredLabel is true', () => {
            mockProps.offer.isSponsored = true;
            mockProps.displaySponsoredLabel = true;

            render(<CarouselOfferCard {...mockProps} />);

            expect(screen.getByTestId('sponsored-pill')).toBeInTheDocument();
            expect(mockPillComponent).toHaveBeenCalledWith({
                contentClass: 'sponsorPill',
                dataTid: 'sponsored-pill',
                ellipsis: true,
                text: SitecoreDictionary.SearchResultsLabelsSponsoredDescription,
                title: SitecoreDictionary.SearchResultsLabelsSponsoredTitle,
            });

            expect(screen.getByTestId('hotel-card')).toHaveClass('sponsored');
        });

        it('should NOT render Sponsored Pill when booking has isSponsored = true but displaySponsoredLabel is false', () => {
            mockProps.offer.isSponsored = true;
            mockProps.displaySponsoredLabel = false;

            render(<CarouselOfferCard {...mockProps} />);

            expect(screen.queryByTestId('sponsored-pill')).not.toBeInTheDocument();
            expect(screen.getByTestId('hotel-card')).toHaveClass('sponsored');
        });

        it('should NOT render Sponsored Pill when booking has isSponsored = true but displaySponsoredLabel is undefined', () => {
            mockProps.offer.isSponsored = true;
            mockProps.displaySponsoredLabel = undefined;

            render(<CarouselOfferCard {...mockProps} />);

            expect(screen.queryByTestId('sponsored-pill')).not.toBeInTheDocument();
            expect(screen.getByTestId('hotel-card')).toHaveClass('sponsored');
        });

        it('should NOT render Sponsored Pill when booking has isSponsored = false even if displaySponsoredLabel is true', () => {
            mockProps.offer.isSponsored = false;
            mockProps.displaySponsoredLabel = true;

            render(<CarouselOfferCard {...mockProps} />);

            expect(screen.queryByTestId('sponsored-pill')).not.toBeInTheDocument();
            expect(screen.getByTestId('hotel-card')).not.toHaveClass('sponsored');
        });
    });

    describe('shortlist button', () => {
        it('should render shortlist button when it is enabled', () => {
            render(<CarouselOfferCard {...mockProps} />);

            expect(screen.getByTestId('shortlist-button')).toBeInTheDocument();
        });

        it('should NOT render shortlist button when it is not enabled', () => {
            mockStores.shortlistStore.isShortlistEnabled = false;

            render(<CarouselOfferCard {...mockProps} />);

            expect(screen.queryByTestId('shortlist-button')).not.toBeInTheDocument();
        });

        it('should NOT render shortlist button on trade', () => {
            mockIsTradeStore = true;

            render(<CarouselOfferCard {...mockProps} />);

            expect(screen.queryByTestId('shortlist-button')).not.toBeInTheDocument();
        });
    });

    describe('LuxuryBadge', () => {
        it('should be rendered when offer.promoCollections contains lux', () => {
            mockProps.offer.promoCollections = ['lux'];

            render(<CarouselOfferCard {...mockProps} />);

            expect(screen.getByTestId('luxury-badge-icon')).toBeInTheDocument();
        });

        it('should be rendered when offer.hotel.promoCollections contains lux', () => {
            mockProps.offer.hotel.promoCollections = ['lux'];

            render(<CarouselOfferCard {...mockProps} />);

            expect(screen.getByTestId('luxury-badge-icon')).toBeInTheDocument();
        });

        it('should be rendered when offer.livePrice.promoCollections contains lux', () => {
            mockProps.offer.livePrice = { promoCollections: ['lux'] };

            render(<CarouselOfferCard {...mockProps} />);

            expect(screen.getByTestId('luxury-badge-icon')).toBeInTheDocument();
        });

        it('should be rendered when livePrice prop.promoCollections contains lux', () => {
            mockProps.livePrice = { promoCollections: ['lux'] };

            render(<CarouselOfferCard {...mockProps} />);

            expect(screen.getByTestId('luxury-badge-icon')).toBeInTheDocument();
        });

        it('should be rendered when multiple locations contain lux (offer.promoCollections + offer.livePrice.promoCollections)', () => {
            mockProps.offer.promoCollections = ['lux'];
            mockProps.offer.livePrice = { promoCollections: ['lux'] };

            render(<CarouselOfferCard {...mockProps} />);

            expect(screen.getByTestId('luxury-badge-icon')).toBeInTheDocument();
        });

        it('should be rendered when all three locations contain lux', () => {
            mockProps.offer.promoCollections = ['lux'];
            mockProps.offer.livePrice = { promoCollections: ['lux'] };
            mockProps.livePrice = { promoCollections: ['lux'] };

            render(<CarouselOfferCard {...mockProps} />);

            expect(screen.getByTestId('luxury-badge-icon')).toBeInTheDocument();
        });

        it('should NOT be rendered when offer.promoCollections is empty array', () => {
            mockProps.offer.promoCollections = [];
            mockProps.offer.hotel.promoCollections = [];

            render(<CarouselOfferCard {...mockProps} />);

            expect(screen.queryByTestId('luxury-badge-icon')).not.toBeInTheDocument();
        });

        it('should NOT be rendered when offer.livePrice.promoCollections exists but is empty', () => {
            mockProps.offer.livePrice = { promoCollections: [] };
            mockProps.offer.hotel.promoCollections = [];

            render(<CarouselOfferCard {...mockProps} />);

            expect(screen.queryByTestId('luxury-badge-icon')).not.toBeInTheDocument();
        });

        it('should NOT be rendered when no location has lux promo code', () => {
            mockProps.offer.promoCollections = [];
            mockProps.offer.hotel.promoCollections = [];
            mockProps.offer.livePrice = { promoCollections: [] };
            mockProps.livePrice = { promoCollections: [] };

            render(<CarouselOfferCard {...mockProps} />);

            expect(screen.queryByTestId('luxury-badge-icon')).not.toBeInTheDocument();
        });

        it('should NOT be rendered when offer is not luxury', () => {
            mockProps.offer.hotel.promoCollections = [];

            render(<CarouselOfferCard {...mockProps} />);

            expect(screen.queryByTestId('luxury-badge-icon')).not.toBeInTheDocument();
        });
    });

    describe('isPricesHidden prop', () => {
        it('should NOT render HotelDeposit when isPricesHidden is true and deposit > 0', () => {
            mockProps.offer.deposit = 100;
            mockIsTradeStore = true;
            mockStores.layoutStore.isPricesHidden = true;

            render(<CarouselOfferCard {...mockProps} />);

            expect(screen.queryByTestId('hotel-deposit')).not.toBeInTheDocument();
        });

        it('should render HotelDeposit when isPricesHidden is false and deposit > 0', () => {
            mockProps.offer.deposit = 100;
            mockIsTradeStore = true;
            mockStores.layoutStore.isPricesHidden = false;

            render(<CarouselOfferCard {...mockProps} />);

            expect(screen.getByTestId('hotel-deposit')).toBeInTheDocument();
        });

        it('should NOT render HotelDiscountPill when isPricesHidden is true and discount > 0', () => {
            jest.spyOn(offerUtils, 'getTotalDiscount').mockReturnValue(50);
            mockIsTradeStore = true;
            mockStores.layoutStore.isPricesHidden = true;

            render(<CarouselOfferCard {...mockProps} />);

            expect(screen.queryByTestId('hotel-discount-pill')).not.toBeInTheDocument();
        });

        it('should render HotelDiscountPill when isPricesHidden is false and discount > 0', () => {
            jest.spyOn(offerUtils, 'getTotalDiscount').mockReturnValue(50);
            mockIsTradeStore = true;
            mockStores.layoutStore.isPricesHidden = false;

            render(<CarouselOfferCard {...mockProps} />);

            expect(screen.getByTestId('hotel-discount-pill')).toBeInTheDocument();
        });

        it('should NOT render FreeNightsIncludedPill when isPricesHidden is true', () => {
            jest.spyOn(nightsUtils, 'getFreeNightsIncludedInOffer').mockReturnValue(2);
            mockIsTradeStore = true;
            mockStores.layoutStore.isPricesHidden = true;

            render(<CarouselOfferCard {...mockProps} />);

            expect(screen.queryByTestId('free-nights-included-pill')).not.toBeInTheDocument();
        });

        it('should render FreeNightsIncludedPill when isPricesHidden is false', () => {
            jest.spyOn(nightsUtils, 'getFreeNightsIncludedInOffer').mockReturnValue(2);
            mockIsTradeStore = true;
            mockStores.layoutStore.isPricesHidden = false;

            render(<CarouselOfferCard {...mockProps} />);

            expect(screen.getByTestId('free-nights-included-pill')).toBeInTheDocument();
        });

        it('should pass isPricesHidden to CarouselOfferPrice component', () => {
            mockIsTradeStore = true;
            mockStores.layoutStore.isPricesHidden = true;

            render(<CarouselOfferCard {...mockProps} />);

            expect(mockCarouselOfferPriceProps).toHaveBeenCalledWith(
                expect.objectContaining({
                    isPricesHidden: true,
                }),
            );
        });

        it('should NOT pass isPricesHidden to CarouselOfferPrice when undefined', () => {
            mockIsTradeStore = false;

            render(<CarouselOfferCard {...mockProps} />);

            expect(mockCarouselOfferPriceProps).toHaveBeenCalledWith(
                expect.objectContaining({
                    isPricesHidden: false,
                }),
            );
        });
    });

    describe('DiscountPercentagePill', () => {
        it('should render DiscountPercentagePill', () => {
            mockProps.offer.discountPercentage = 10;

            render(<CarouselOfferCard {...mockProps} />);

            expect(screen.getByTestId('discount-percentage-pill')).toBeInTheDocument();
            expect(mockDiscountPercentagePill).toHaveBeenCalledWith({
                discountPercentage: 10,
                icon: expect.any(Object),
                pillSize: PillSizeVariants.Small,
            });
        });
    });

    describe('Video handling', () => {
        it('should pass video props to OfferCardSlider when they are present', () => {
            mockProps.offer.hotel.youtubeVideoId = 'youtube_video_id';
            mockProps.offer.hotel.cloudinaryVideoSrc = 'cloudinary_video_src';
            mockProps.offer.hotel.videoPlaceholder = 'video_placeholder';

            render(<CarouselOfferCard {...mockProps} />);

            expect(mockOfferCardSlider).toHaveBeenCalledWith(
                expect.objectContaining({
                    youtubeVideoId: 'youtube_video_id',
                    videoIndex: 1,
                    videoPlaceholder: 'video_placeholder',
                    cloudinaryVideoSrc: 'cloudinary_video_src',
                }),
            );
        });
    });
});
