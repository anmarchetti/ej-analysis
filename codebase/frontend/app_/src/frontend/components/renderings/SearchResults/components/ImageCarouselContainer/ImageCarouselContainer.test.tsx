import React from 'react';
import { SwipeableHandlers } from 'react-swipeable';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';

import { Tokens } from 'code/tokens';
import { createMockStores } from 'frontend/__mocks__/createMockStores';
import * as trackingUtils from 'frontend/hooks/useCarouselTracking/useCarouselTracking';
import * as discountUtils from 'frontend/utils/discount.utils';
import * as tokenizerUtils from 'frontend/utils/tokenizer';
import { IOffer } from 'models/data/IOffer';
import SitecoreDictionary from 'models/enum/SitecoreDictionary';
import SiteSettings from 'models/enum/SiteSettings';

import ImageCarouselContainer, { IImageCarouselContainerProps } from './ImageCarouselContainer';

const createProps = (): IImageCarouselContainerProps => ({
    offer: {
        hasDistressedFlights: true,
        hotel: { country: { code: 'UK' } },
        promotion: { cardDescription: 'Promo description' },
        date: '123',
        transport: { routes: [{ depT: 'example' }, {}] },
        isSponsored: true,
        accom: { isExt: true },
    } as IOffer,
    fallbackImage: '',
});

const createStores = () =>
    createMockStores({
        layoutStore: {
            isWeLovePillEnabled: false,
            isPillVisible: jest.fn(() => true),
            pageName: 'Test Promo',
            isApplySpecialFilter: jest.fn(() => false),
            isPromoPage: false,
            layout: {},
            isSearchResultsPage: false,
        },
        marketStore: {
            currency: 'GBP',
            formatMoney: jest.fn(() => '£100'),
        },
    });

let mocksProps = createProps();
let mockStores = createStores();

jest.spyOn(trackingUtils, 'default').mockReturnValue({
    swipeHandlers: {} as SwipeableHandlers,
    handleSlide: jest.fn(),
    onCarouselSync: jest.fn(),
    trackFullScreenClose: jest.fn(),
    trackFullScreenOpen: jest.fn(),
    trackThumbnailClick: jest.fn(),
});

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

jest.mock('frontend/components/common/LikeBadge', () => ({
    __esModule: true,
    default: () => <div data-tid='like-badge' />,
}));

const mockPillComponent = jest.fn();
jest.mock('frontend/components/common/Pills/Pill/Pill', () => ({
    __esModule: true,
    default: props => {
        mockPillComponent(props);

        return <div data-tid='pill' />;
    },
}));

const mockOfferCardSlider = jest.fn();
jest.mock('frontend/components/common/OfferCardSlider/OfferCardSlider', () => ({
    __esModule: true,
    default: props => {
        mockOfferCardSlider(props);

        return (
            <div data-tid='offer-card-slider'>
                <button onClick={() => props.setShowPills(false)} data-tid='remove-pills' />
            </div>
        );
    },
}));

jest.mock('frontend/components/common/PromoBadge', () => ({
    __esModule: true,
    default: ({ text }) => {
        if (!text || text.trim() === '') {
            return null;
        }

        return <div data-tid='promo-badge'>{text}</div>;
    },
}));

describe('<ImageCarouselContainer />', () => {
    beforeEach(() => {
        mocksProps = createProps();
        mockStores = createStores();
    });

    it('should render', () => {
        render(<ImageCarouselContainer {...mocksProps} />);

        expect(screen.getByTestId('offer-card-slider')).toBeInTheDocument();
        expect(screen.getByTestId('promo-badge')).toBeInTheDocument();
        expect(mockOfferCardSlider).toHaveBeenCalledWith({
            images: mocksProps.offer.hotel?.images,
            fallbackImage: mocksProps.fallbackImage,
            showIndex: true,
            isFullScreenEnabled: false,
            setShowPills: expect.any(Function),
            offer: mocksProps.offer,
            youtubeVideoId: '',
            videoPlaceholder: '',
            trackingHandlers: {
                handleSlide: expect.any(Function),
                onCarouselSync: expect.any(Function),
                swipeHandlers: {},
                trackFullScreenClose: expect.any(Function),
                trackFullScreenOpen: expect.any(Function),
                trackThumbnailClick: expect.any(Function),
            },
            cloudinaryVideoSrc: '',
        });
    });

    describe('Youtube id', () => {
        it('should get youtube id from layout when isPromoPage is true', () => {
            mockStores.layoutStore.layout = {
                sitecore: { route: { fields: { YoutubeVideoId: { value: 'test id' } } } },
            };
            mockStores.layoutStore.isPromoPage = true;

            render(<ImageCarouselContainer {...mocksProps} />);

            expect(mockOfferCardSlider).toHaveBeenCalledWith(
                expect.objectContaining({
                    youtubeVideoId: 'test id',
                }),
            );
        });

        it('should get youtube id from layout when isSearchResultsPage is true', () => {
            mockStores.layoutStore.layout = {
                sitecore: { route: { fields: { YoutubeVideoId: { value: 'test id' } } } },
            };
            mockStores.layoutStore.isSearchResultsPage = true;

            render(<ImageCarouselContainer {...mocksProps} />);

            expect(mockOfferCardSlider).toHaveBeenCalledWith(
                expect.objectContaining({
                    youtubeVideoId: 'test id',
                }),
            );
        });

        it('should get youtube id from offer when layout is empty and isSearchResultsPage is true', () => {
            mocksProps.offer.hotel!.youtubeVideoId = 'test id2';
            mockStores.layoutStore.isSearchResultsPage = true;

            render(<ImageCarouselContainer {...mocksProps} />);

            expect(mockOfferCardSlider).toHaveBeenCalledWith(
                expect.objectContaining({
                    youtubeVideoId: 'test id2',
                }),
            );
        });

        it('should get empty youtube id when isSearchResultsPage and isPromoPage are false', () => {
            mocksProps.offer.hotel!.youtubeVideoId = 'test id2';

            render(<ImageCarouselContainer {...mocksProps} />);

            expect(mockOfferCardSlider).toHaveBeenCalledWith(
                expect.objectContaining({
                    youtubeVideoId: '',
                }),
            );
        });
    });

    describe('Youtube video placeholder', () => {
        it('should get youtube video placeholder from layout', () => {
            mockStores.layoutStore.isSearchResultsPage = true;
            mockStores.layoutStore.layout = {
                sitecore: { route: { fields: { VideoPlaceholder: { value: { src: 'test src' } } } } },
            };

            render(<ImageCarouselContainer {...mocksProps} />);

            expect(mockOfferCardSlider).toHaveBeenCalledWith(
                expect.objectContaining({
                    videoPlaceholder: 'test src',
                }),
            );
        });

        it('should get youtube video placeholder from offer', () => {
            mockStores.layoutStore.isSearchResultsPage = true;
            mocksProps.offer!.hotel!.videoPlaceholder = 'test src2';

            render(<ImageCarouselContainer {...mocksProps} />);

            expect(mockOfferCardSlider).toHaveBeenCalledWith(
                expect.objectContaining({
                    videoPlaceholder: 'test src2',
                }),
            );
        });

        it('should get empty youtube video placeholder when offer and layout are empty', () => {
            render(<ImageCarouselContainer {...mocksProps} />);

            expect(mockOfferCardSlider).toHaveBeenCalledWith(
                expect.objectContaining({
                    videoPlaceholder: '',
                }),
            );
        });
    });

    describe('SuperDeal Label', () => {
        it("should NOT show label if it's a Promo Page with special filter", () => {
            mockStores.layoutStore.isPromoPage = true;
            mockStores.layoutStore.isApplySpecialFilter = jest.fn(() => true);

            render(<ImageCarouselContainer {...mocksProps} />);

            expect(mockStores.layoutStore.isApplySpecialFilter).toHaveBeenCalledWith(
                SiteSettings.HideSuperDeals,
                'Test Promo',
            );
            expect(screen.queryByTestId('hotel-super-deal')).not.toBeInTheDocument();
        });

        it("should NOT show label if offer doesn't have DistressedFlights", () => {
            mocksProps.offer.hasDistressedFlights = false;

            render(<ImageCarouselContainer {...mocksProps} />);

            expect(screen.queryByTestId('hotel-super-deal')).not.toBeInTheDocument();
        });

        it('should show label if offer has DistressedFlights and country is NOT excluded on sitecore', () => {
            render(<ImageCarouselContainer {...mocksProps} />);

            expect(mockStores.layoutStore.isPillVisible).toHaveBeenCalledWith(SiteSettings.SuperDealsLabel, 'UK');
            expect(screen.getByTestId('hotel-super-deal')).toBeInTheDocument();
        });

        it('should NOT show label if offer has DistressedFlights, but country is excluded on sitecore', () => {
            mockStores.layoutStore.isPillVisible = jest.fn(() => false);

            render(<ImageCarouselContainer {...mocksProps} />);

            expect(mockStores.layoutStore.isPillVisible).toHaveBeenCalledWith(SiteSettings.SuperDealsLabel, 'UK');
            expect(screen.queryByTestId('hotel-super-deal')).not.toBeInTheDocument();
        });

        it('should render LikeBadge when isExt is false, isSponsored is false and isWeLovePillEnabled is true', () => {
            mockStores.layoutStore.isWeLovePillEnabled = true;
            mocksProps.offer.accom.isExt = false;
            mocksProps.offer.isSponsored = false;

            render(<ImageCarouselContainer {...mocksProps} />);

            expect(screen.getByTestId('like-badge')).toBeInTheDocument();
        });

        it('should remove all pills except like-badge', () => {
            render(<ImageCarouselContainer {...mocksProps} />);

            expect(screen.getByTestId('hotel-super-deal')).toBeInTheDocument();
            expect(screen.getByTestId('pill')).toBeInTheDocument();
            expect(mockPillComponent).toHaveBeenCalledWith({
                contentClass: 'sponsorPill priority',
                ellipsis: true,
                text: SitecoreDictionary.SearchResultsLabelsSponsoredDescription,
                title: SitecoreDictionary.SearchResultsLabelsSponsoredTitle,
            });

            const button = screen.getByTestId('remove-pills');

            fireEvent.click(button);

            expect(screen.queryByTestId('hotel-super-deal')).not.toBeInTheDocument();
            expect(screen.queryByTestId('pill')).not.toBeInTheDocument();
        });

        it('should remove like-badge', async () => {
            mockStores.layoutStore.isWeLovePillEnabled = true;
            mocksProps.offer.accom.isExt = false;
            mocksProps.offer.isSponsored = false;
            render(<ImageCarouselContainer {...mocksProps} />);
            expect(screen.getByTestId('like-badge')).toBeInTheDocument();
            const button = screen.getByTestId('remove-pills');
            fireEvent.click(button);

            await waitFor(() => expect(screen.queryByTestId('like-badge')).not.toBeInTheDocument());
        });
    });

    describe('Promotion cardDescription tokenization', () => {
        describe('getDiscount behavior', () => {
            it('should tokenize cardDescription with discount when discountAmountPerBooking exists', () => {
                const mockGetDiscount = jest.spyOn(discountUtils, 'getDiscount').mockReturnValue('£50 off');
                const mockGetDiscountPerPerson = jest.spyOn(discountUtils, 'getDiscountPerPerson');
                const mockTokenizerReplaceToken = jest.spyOn(tokenizerUtils.Tokenizer, 'replaceToken');

                mockTokenizerReplaceToken.mockReturnValue('Save £50 off on your booking');

                mocksProps.offer.promotion = {
                    cardDescription: 'Save {discount} on your booking',
                    discountAmountPerBooking: 50,
                    percentageDiscountPerBooking: 0,
                };

                render(<ImageCarouselContainer {...mocksProps} />);

                expect(mockGetDiscount).toHaveBeenCalledWith(mocksProps.offer.promotion, 'GBP', expect.any(Function));
                expect(mockGetDiscountPerPerson).not.toHaveBeenCalled();
                expect(mockTokenizerReplaceToken).toHaveBeenCalledWith(
                    'Save {discount} on your booking',
                    Tokens.Discount,
                    '£50 off',
                );
            });

            it('should tokenize cardDescription with discount when percentageDiscountPerBooking exists', () => {
                const mockGetDiscount = jest.spyOn(discountUtils, 'getDiscount').mockReturnValue('20% off');
                const mockGetDiscountPerPerson = jest.spyOn(discountUtils, 'getDiscountPerPerson');
                const mockTokenizerReplaceToken = jest.spyOn(tokenizerUtils.Tokenizer, 'replaceToken');

                mockTokenizerReplaceToken.mockReturnValue('Get 20% off discount');

                mocksProps.offer.promotion = {
                    cardDescription: 'Get {discount} discount',
                    discountAmountPerBooking: 0,
                    percentageDiscountPerBooking: 20,
                };

                render(<ImageCarouselContainer {...mocksProps} />);

                expect(mockGetDiscount).toHaveBeenCalledWith(mocksProps.offer.promotion, 'GBP', expect.any(Function));
                expect(mockGetDiscountPerPerson).not.toHaveBeenCalled();
                expect(mockTokenizerReplaceToken).toHaveBeenCalledWith(
                    'Get {discount} discount',
                    Tokens.Discount,
                    '20% off',
                );
            });
        });

        describe('getDiscountPerPerson behavior', () => {
            it('should tokenize cardDescription with discountPerPerson token when discountAmountPerPerson exists', () => {
                const mockGetDiscount = jest.spyOn(discountUtils, 'getDiscount');
                const mockGetDiscountPerPerson = jest
                    .spyOn(discountUtils, 'getDiscountPerPerson')
                    .mockReturnValue('£25');
                const mockTokenizerReplaceToken = jest.spyOn(tokenizerUtils.Tokenizer, 'replaceToken');

                mockTokenizerReplaceToken.mockReturnValue('Save £25 per person on your booking');

                mocksProps.offer.promotion = {
                    cardDescription: 'Save {discountPerPerson} per person on your booking',
                    discountAmountPerPerson: 25,
                };

                render(<ImageCarouselContainer {...mocksProps} />);

                expect(mockGetDiscount).not.toHaveBeenCalled();
                expect(mockGetDiscountPerPerson).toHaveBeenCalledWith(
                    mocksProps.offer.promotion,
                    'GBP',
                    expect.any(Function),
                    '',
                    ' pp',
                );
                expect(mockTokenizerReplaceToken).toHaveBeenCalledWith(
                    'Save {discountPerPerson} per person on your booking',
                    Tokens.DiscountPerPerson,
                    '£25',
                );
            });

            it('should tokenize cardDescription with discountPerPerson token when discountPercentagePerPerson exists', () => {
                const mockGetDiscount = jest.spyOn(discountUtils, 'getDiscount');
                const mockGetDiscountPerPerson = jest
                    .spyOn(discountUtils, 'getDiscountPerPerson')
                    .mockReturnValue('15%');
                const mockTokenizerReplaceToken = jest.spyOn(tokenizerUtils.Tokenizer, 'replaceToken');

                mockTokenizerReplaceToken.mockReturnValue('Save 15% per person on your booking');

                mocksProps.offer.promotion = {
                    cardDescription: 'Save {discountPerPerson} per person on your booking',
                    discountPercentagePerPerson: 0.15,
                };

                render(<ImageCarouselContainer {...mocksProps} />);

                expect(mockGetDiscount).not.toHaveBeenCalled();
                expect(mockGetDiscountPerPerson).toHaveBeenCalledWith(
                    mocksProps.offer.promotion,
                    'GBP',
                    expect.any(Function),
                    '',
                    ' pp',
                );
                expect(mockTokenizerReplaceToken).toHaveBeenCalledWith(
                    'Save {discountPerPerson} per person on your booking',
                    Tokens.DiscountPerPerson,
                    '15%',
                );
            });

            it('should prioritize discountAmountPerPerson when both discountAmountPerPerson and discountPercentagePerPerson are provided', () => {
                const mockGetDiscount = jest.spyOn(discountUtils, 'getDiscount');
                const mockGetDiscountPerPerson = jest
                    .spyOn(discountUtils, 'getDiscountPerPerson')
                    .mockReturnValue('£50');
                const mockTokenizerReplaceToken = jest.spyOn(tokenizerUtils.Tokenizer, 'replaceToken');

                mockTokenizerReplaceToken.mockReturnValue('Save £50 per person on your booking');

                mocksProps.offer.promotion = {
                    cardDescription: 'Save {discountPerPerson} per person on your booking',
                    discountAmountPerPerson: 50,
                    discountPercentagePerPerson: 0.2,
                };

                render(<ImageCarouselContainer {...mocksProps} />);

                expect(mockGetDiscount).not.toHaveBeenCalled();
                expect(mockGetDiscountPerPerson).toHaveBeenCalledWith(
                    mocksProps.offer.promotion,
                    'GBP',
                    expect.any(Function),
                    '',
                    ' pp',
                );
                expect(mockTokenizerReplaceToken).toHaveBeenCalledWith(
                    'Save {discountPerPerson} per person on your booking',
                    Tokens.DiscountPerPerson,
                    '£50',
                );
            });

            it('should not call getDiscountPerPerson when no per-person discount fields are provided', () => {
                const mockGetDiscount = jest.spyOn(discountUtils, 'getDiscount');
                const mockGetDiscountPerPerson = jest.spyOn(discountUtils, 'getDiscountPerPerson');

                mocksProps.offer.promotion = {
                    cardDescription: 'Regular promotion text',
                    discountAmountPerBooking: 100,
                };

                render(<ImageCarouselContainer {...mocksProps} />);

                expect(mockGetDiscount).toHaveBeenCalled();
                expect(mockGetDiscountPerPerson).not.toHaveBeenCalled();
            });
        });

        describe('No discount scenarios', () => {
            it('should render PromoBadge with original cardDescription when promotion has no discount', () => {
                const mockGetDiscount = jest.spyOn(discountUtils, 'getDiscount');
                const mockGetDiscountPerPerson = jest.spyOn(discountUtils, 'getDiscountPerPerson');

                mocksProps.offer.promotion = {
                    cardDescription: 'Regular promotion text',
                    discountAmountPerBooking: 0,
                    percentageDiscountPerBooking: 0,
                };

                render(<ImageCarouselContainer {...mocksProps} />);

                expect(mockGetDiscount).not.toHaveBeenCalled();
                expect(mockGetDiscountPerPerson).not.toHaveBeenCalled();
                expect(screen.getByTestId('promo-badge')).toHaveTextContent('Regular promotion text');
            });
        });

        it('should NOT render promoBlock when cardDescription is empty', () => {
            const mockTokenizerReplaceToken = jest.spyOn(tokenizerUtils.Tokenizer, 'replaceToken');
            mockTokenizerReplaceToken.mockReturnValue('');

            mocksProps.offer.promotion = {
                cardDescription: '',
                discountAmountPerBooking: 50,
                percentageDiscountPerBooking: 0,
            };

            render(<ImageCarouselContainer {...mocksProps} />);

            expect(screen.queryByTestId('promo-badge')).not.toBeInTheDocument();
        });

        it('should NOT render promoBlock when cardDescription is null', () => {
            const mockTokenizerReplaceToken = jest.spyOn(tokenizerUtils.Tokenizer, 'replaceToken');
            mockTokenizerReplaceToken.mockReturnValue('');

            mocksProps.offer.promotion = {
                cardDescription: null as any,
                discountAmountPerBooking: 50,
                percentageDiscountPerBooking: 0,
            };

            render(<ImageCarouselContainer {...mocksProps} />);

            expect(screen.queryByTestId('promo-badge')).not.toBeInTheDocument();
        });
    });
});
