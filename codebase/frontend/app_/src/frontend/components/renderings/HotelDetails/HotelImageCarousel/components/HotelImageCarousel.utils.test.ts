import { renderHook } from '@testing-library/react';

import { CurrencyCode } from 'code/currency';
import { createMockStores } from 'frontend/__mocks__';
import * as discountUtils from 'frontend/utils/discount.utils';
import * as tokenizerUtils from 'frontend/utils/tokenizer';
import { ISliderImage, ISliderVideo } from 'frontend/components/common/OfferCardSlider/OfferCardSlider';

import useIsLuxuryStatus, {
    changeMainImageSrcInEditMode,
    getCardDescription,
    getDesktopLuxuryProps,
    handleThumbnailClickInEditMode,
    shouldPreventFullScreenActivation,
} from './HotelImageCarousel.utils';

jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useContext: () => mockStores,
}));

let mockStores;

const mockGetDiscount = jest.spyOn(discountUtils, 'getDiscount');
const mockGetDiscountPerPerson = jest.spyOn(discountUtils, 'getDiscountPerPerson');
const mockReplaceToken = jest.spyOn(tokenizerUtils.Tokenizer, 'replaceToken');

describe('HotelImageCarousel.utils', () => {
    describe('useIsLuxuryStatus', () => {
        beforeEach(() => {
            mockStores = createMockStores({
                layoutStore: {
                    layout: {
                        sitecore: {
                            route: {
                                fields: {
                                    PromoCollections: [
                                        { fields: { Key: { value: 'lux' } } },
                                        { fields: { Key: { value: 'test' } } },
                                    ],
                                },
                            },
                        },
                    },
                },
            });
        });

        it('should return true when lux code is present in offer', () => {
            const { result } = renderHook(() => useIsLuxuryStatus(['lux', '', 'test']));

            expect(result.current).toBe(true);
        });

        it('should return true when lux code is present in layout', () => {
            const { result } = renderHook(() => useIsLuxuryStatus(undefined));

            expect(result.current).toBe(true);
        });

        it('should return false when lux code is NOT present in neither layout nor offer', () => {
            mockStores.layoutStore.layout = undefined;

            const { result } = renderHook(() => useIsLuxuryStatus(undefined));

            expect(result.current).toBe(false);
        });
    });

    describe('shouldPreventFullScreenActivation', () => {
        let imageElement: HTMLImageElement;

        beforeEach(() => {
            imageElement = new Image();
        });

        it('should return true when target does NOT have src', () => {
            expect(shouldPreventFullScreenActivation(imageElement)).toBe(true);
        });

        it('should return true when target has data-tid equal to video-thumbnail-image', () => {
            imageElement.src = '/test/';
            imageElement.setAttribute('data-tid', 'video-thumbnail-image');

            expect(shouldPreventFullScreenActivation(imageElement)).toBe(true);
        });

        it('should return true when target has src that includes youtube', () => {
            imageElement.src = '/test/youtube/video.mp4';

            expect(shouldPreventFullScreenActivation(imageElement)).toBe(true);
        });

        it('should return true when target has src that includes cloudinary', () => {
            imageElement.src = '/test/cloudinary/image.jpg';

            expect(shouldPreventFullScreenActivation(imageElement)).toBe(true);
        });

        it('should return false when target has src that does NOT include cloudinary or youtube and data-tid NOT equal to video-thumbnail-image', () => {
            imageElement.src = '/test/other/image.jpg';
            imageElement.setAttribute('data-tid', 'test-image');

            expect(shouldPreventFullScreenActivation(imageElement)).toBe(false);
        });
    });

    describe('getDesktopLuxuryProps', () => {
        it('should return video placeholder as imageSrc when videoId and videoPlaceholder are provided', () => {
            const result = getDesktopLuxuryProps({
                videoId: 'video-id',
                videoPlaceholder: 'video-placeholder',
                images: [{ large: 'image-large' }],
                cookiesAccepted: true,
                mainSlideRef: { current: { slideToIndex: jest.fn() } },
                setAutoPlay: jest.fn(),
                onThumbnailClick: jest.fn(),
                setIsFullScreenActive: jest.fn(),
            });

            expect(result.imageSrc).toBe('video-placeholder');
        });

        it('should return first image as imageSrc when videoId or videoPlaceholder are not provided', () => {
            const result = getDesktopLuxuryProps({
                images: [{ large: 'image-large' }],
                cookiesAccepted: true,
                mainSlideRef: { current: { slideToIndex: jest.fn() } },
                setAutoPlay: jest.fn(),
                onThumbnailClick: jest.fn(),
                setIsFullScreenActive: jest.fn(),
            });

            expect(result.imageSrc).toBe('image-large');
        });

        it('should return undefined for onPlayVideo when cookies are not accepted', () => {
            const result = getDesktopLuxuryProps({
                videoId: 'video-id',
                videoPlaceholder: 'video-placeholder',
                cookiesAccepted: false,
                mainSlideRef: { current: { slideToIndex: jest.fn() } },
                setAutoPlay: jest.fn(),
                onThumbnailClick: jest.fn(),
                setIsFullScreenActive: jest.fn(),
            });

            expect(result.onPlayVideo).toBeUndefined();
        });

        it('should return a function for onPlayVideo when cookies are accepted and videoId is provided', () => {
            const mockSlideToIndex = jest.fn();
            const mockSetAutoPlay = jest.fn();
            const mockOnThumbnailClick = jest.fn();
            const mockSetIsFullScreenActive = jest.fn();

            const result = getDesktopLuxuryProps({
                videoId: 'video-id',
                videoPlaceholder: 'video-placeholder',
                cookiesAccepted: true,
                mainSlideRef: { current: { slideToIndex: mockSlideToIndex } },
                setAutoPlay: mockSetAutoPlay,
                onThumbnailClick: mockOnThumbnailClick,
                setIsFullScreenActive: mockSetIsFullScreenActive,
            });

            expect(result.onPlayVideo).toBeInstanceOf(Function);

            jest.useFakeTimers();

            result.onPlayVideo?.();

            jest.runAllTimers();

            expect(mockSlideToIndex).toHaveBeenCalledWith(0);
            expect(mockSetAutoPlay).toHaveBeenCalledWith(true);
            expect(mockOnThumbnailClick).toHaveBeenCalled();
            expect(mockSetIsFullScreenActive).toHaveBeenCalledWith(true);
        });

        it('should return a function for onExpand that activates full screen mode', () => {
            const mockSlideToIndex = jest.fn();
            const mockOnThumbnailClick = jest.fn();
            const mockSetIsFullScreenActive = jest.fn();

            const result = getDesktopLuxuryProps({
                images: [{ large: 'image-large' }],
                cookiesAccepted: true,
                mainSlideRef: { current: { slideToIndex: mockSlideToIndex } },
                setAutoPlay: jest.fn(),
                onThumbnailClick: mockOnThumbnailClick,
                setIsFullScreenActive: mockSetIsFullScreenActive,
            });

            jest.useFakeTimers();

            result.onExpand();

            jest.runAllTimers();

            expect(mockSlideToIndex).toHaveBeenCalledWith(0);
            expect(mockOnThumbnailClick).toHaveBeenCalled();
            expect(mockSetIsFullScreenActive).toHaveBeenCalledWith(true);
        });
    });

    describe('getCardDescription', () => {
        let mockFormatMoney;

        beforeEach(() => {
            mockFormatMoney = jest.fn().mockReturnValue('£50');
            mockGetDiscount.mockReturnValue('£50');
            mockGetDiscountPerPerson.mockReturnValue('£25 PP');
            mockReplaceToken.mockImplementation(
                (template, token, replacement) => template?.replace(token as string, replacement as string) || '',
            );
        });

        it('should return empty string when isPromoBannerShown is false', () => {
            const result = getCardDescription({
                isPromoBannerShown: false,
                currency: 'GBP' as CurrencyCode,
                formatMoney: mockFormatMoney,
                labelBeforePrice: '',
                labelAfterPrice: '',
                offer: {
                    promotion: {
                        cardDescription: 'Save {discount} on your booking',
                        discountAmountPerBooking: 50,
                    },
                } as any,
            });

            expect(result).toBe('');
        });

        it('should return undefined when offer has no promotion', () => {
            const result = getCardDescription({
                isPromoBannerShown: true,
                currency: 'GBP' as CurrencyCode,
                formatMoney: mockFormatMoney,
                labelBeforePrice: '',
                labelAfterPrice: '',
                offer: {} as any,
            });

            expect(result).toBeUndefined();
        });

        it('should return undefined when cardDescription is not provided', () => {
            const result = getCardDescription({
                isPromoBannerShown: true,
                currency: 'GBP' as CurrencyCode,
                formatMoney: mockFormatMoney,
                labelBeforePrice: '',
                labelAfterPrice: '',
                offer: {
                    promotion: {
                        discountAmountPerBooking: 50,
                        cardDescription: undefined,
                    },
                } as any,
            });

            expect(result).toBeUndefined();
        });

        it('should tokenize cardDescription with discount when discountAmountPerBooking exists', () => {
            const result = getCardDescription({
                isPromoBannerShown: true,
                currency: 'GBP' as CurrencyCode,
                formatMoney: mockFormatMoney,
                labelBeforePrice: '',
                labelAfterPrice: '',
                offer: {
                    promotion: {
                        cardDescription: 'Save {discount} on your booking',
                        discountAmountPerBooking: 50,
                    },
                } as any,
            });

            expect(mockGetDiscount).toHaveBeenCalledWith(
                { cardDescription: 'Save {discount} on your booking', discountAmountPerBooking: 50 },
                'GBP',
                mockFormatMoney,
            );
            expect(mockReplaceToken).toHaveBeenCalledWith('Save {discount} on your booking', '{discount}', '£50');
            expect(result).toBe('Save £50 on your booking');
        });

        it('should tokenize cardDescription with discount when percentageDiscountPerBooking exists', () => {
            const result = getCardDescription({
                isPromoBannerShown: true,
                currency: 'GBP' as CurrencyCode,
                formatMoney: mockFormatMoney,
                labelBeforePrice: '',
                labelAfterPrice: '',
                offer: {
                    promotion: {
                        cardDescription: 'Save {discount} on your booking',
                        percentageDiscountPerBooking: 10,
                    },
                } as any,
            });

            expect(mockGetDiscount).toHaveBeenCalledWith(
                { cardDescription: 'Save {discount} on your booking', percentageDiscountPerBooking: 10 },
                'GBP',
                mockFormatMoney,
            );
            expect(result).toBe('Save £50 on your booking');
        });

        it('should tokenize cardDescription with discountPerPerson when discountAmountPerPerson exists', () => {
            const result = getCardDescription({
                isPromoBannerShown: true,
                currency: 'GBP' as CurrencyCode,
                formatMoney: mockFormatMoney,
                labelBeforePrice: '',
                labelAfterPrice: '',
                offer: {
                    promotion: {
                        cardDescription: 'Save {discountPerPerson} on your booking',
                        discountAmountPerPerson: 25,
                    },
                } as any,
            });

            expect(mockGetDiscountPerPerson).toHaveBeenCalledWith(
                { cardDescription: 'Save {discountPerPerson} on your booking', discountAmountPerPerson: 25 },
                'GBP',
                mockFormatMoney,
                '',
                '',
            );
            expect(result).toBe('Save £25 PP on your booking');
        });

        it('should tokenize cardDescription with discountPerPerson when discountPercentagePerPerson exists', () => {
            const result = getCardDescription({
                isPromoBannerShown: true,
                currency: 'GBP' as CurrencyCode,
                formatMoney: mockFormatMoney,
                labelBeforePrice: '',
                labelAfterPrice: '',
                offer: {
                    promotion: {
                        cardDescription: 'Save {discountPerPerson} on your booking',
                        discountPercentagePerPerson: 0.15,
                    },
                } as any,
            });

            expect(mockGetDiscountPerPerson).toHaveBeenCalledWith(
                { cardDescription: 'Save {discountPerPerson} on your booking', discountPercentagePerPerson: 0.15 },
                'GBP',
                mockFormatMoney,
                '',
                '',
            );
            expect(result).toBe('Save £25 PP on your booking');
        });

        it('should NOT tokenize cardDescription when no discount exists', () => {
            const result = getCardDescription({
                isPromoBannerShown: true,
                currency: 'GBP' as CurrencyCode,
                formatMoney: mockFormatMoney,
                labelBeforePrice: '',
                labelAfterPrice: '',
                offer: {
                    promotion: {
                        cardDescription: 'Save {discount} on your booking',
                    },
                } as any,
            });

            expect(mockGetDiscount).not.toHaveBeenCalled();
            expect(mockGetDiscountPerPerson).not.toHaveBeenCalled();
            expect(result).toBe('Save {discount} on your booking');
        });

        it('should handle both discount and discountPerPerson tokens', () => {
            mockReplaceToken
                .mockReturnValueOnce('Save £50 or {discountPerPerson} on your booking')
                .mockReturnValueOnce('Save £50 or £25 PP on your booking');

            const result = getCardDescription({
                isPromoBannerShown: true,
                currency: 'GBP' as CurrencyCode,
                formatMoney: mockFormatMoney,
                labelBeforePrice: '',
                labelAfterPrice: '',
                offer: {
                    promotion: {
                        cardDescription: 'Save {discount} or {discountPerPerson} on your booking',
                        discountAmountPerBooking: 50,
                        discountAmountPerPerson: 25,
                    },
                } as any,
            });

            expect(mockGetDiscount).toHaveBeenCalledWith(
                {
                    cardDescription: 'Save {discount} or {discountPerPerson} on your booking',
                    discountAmountPerBooking: 50,
                    discountAmountPerPerson: 25,
                },
                'GBP',
                mockFormatMoney,
            );
            expect(mockGetDiscountPerPerson).toHaveBeenCalledWith(
                {
                    cardDescription: 'Save {discount} or {discountPerPerson} on your booking',
                    discountAmountPerBooking: 50,
                    discountAmountPerPerson: 25,
                },
                'GBP',
                mockFormatMoney,
                '',
                '',
            );
            expect(result).toBe('Save £50 or £25 PP on your booking');
        });
    });

    describe('changeMainImageSrcInEditMode', () => {
        const mockGetCurrentIndex = jest.fn(() => 1);
        const mockSetAttribute = jest.fn();
        const mockEl = { setAttribute: mockSetAttribute } as unknown as HTMLElement;
        const getElementByIdSpy = jest.spyOn(document, 'getElementById').mockReturnValue(mockEl);
        const mockImagesWithVideo = [
            { videoPlaceholder: 'video-2-placeholder' },
            { image: { large: 'image-1-large' } },
        ] as (ISliderImage | ISliderVideo)[];

        it('should set src images from slider image', () => {
            changeMainImageSrcInEditMode(
                true,
                { current: { getCurrentIndex: mockGetCurrentIndex } },
                mockImagesWithVideo,
            );

            expect(mockGetCurrentIndex).toHaveBeenCalled();
            expect(getElementByIdSpy).toHaveBeenCalledTimes(2);
            expect(mockSetAttribute).toHaveBeenCalledTimes(2);
            expect(mockSetAttribute).toHaveBeenNthCalledWith(1, 'src', 'image-1-large');
        });

        it('should set src images from video placeholder', () => {
            changeMainImageSrcInEditMode(true, { current: { getCurrentIndex: jest.fn() } }, mockImagesWithVideo);

            expect(mockSetAttribute).toHaveBeenNthCalledWith(1, 'src', 'video-2-placeholder');
        });

        it('should set empty string to src when imagesWithVideo is empty', () => {
            changeMainImageSrcInEditMode(true, { current: { getCurrentIndex: jest.fn() } }, []);

            expect(mockSetAttribute).toHaveBeenNthCalledWith(1, 'src', '');
        });

        it('should NOT call setAttribute when getElementById is not found', () => {
            getElementByIdSpy.mockReturnValue(null);

            changeMainImageSrcInEditMode(true, { current: { getCurrentIndex: jest.fn() } }, []);

            expect(getElementByIdSpy).toHaveBeenCalledTimes(2);
            expect(mockSetAttribute).not.toHaveBeenCalled();
        });

        it('should NOT call getCurrentIndex when isLuxuryDesktopEditMode is false', () => {
            changeMainImageSrcInEditMode(false, { current: { getCurrentIndex: jest.fn() } }, []);

            expect(mockGetCurrentIndex).not.toHaveBeenCalled();
        });
    });

    describe('handleThumbnailClickInEditMode', () => {
        const mockSlideToIndex = jest.fn();

        it('should call slideToIndex with index from element', () => {
            const elementWithIndex = document.createElement('div');
            elementWithIndex.dataset.itemIndex = '2';

            handleThumbnailClickInEditMode(
                {
                    closest: () => ({
                        querySelector: () => elementWithIndex,
                    }),
                } as unknown as HTMLElement,
                { current: { slideToIndex: mockSlideToIndex } },
            );

            expect(mockSlideToIndex).toHaveBeenCalledWith(2);
        });

        it('should call slideToIndex with 0 when index from element is NOT provided', () => {
            const elementWithoutIndex = document.createElement('div');

            handleThumbnailClickInEditMode(
                {
                    closest: () => ({
                        querySelector: () => elementWithoutIndex,
                    }),
                } as unknown as HTMLElement,
                {
                    current: { slideToIndex: mockSlideToIndex },
                },
            );

            expect(mockSlideToIndex).toHaveBeenCalledWith(0);
        });
    });
});
