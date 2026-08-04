import { cmsUrls } from 'code/endpoints';
import { IOffer } from 'models/data/IOffer';
import { ISitecoreLayout } from 'models/data/SitecoreLayout';

import { getIsSuperDealShownStatus, getVideoData } from './ImageCarouselContainer.utils';

describe('ImageCarouselContainer.utils', () => {
    describe('getVideoData', () => {
        it('should return default video data when neither isSearchResultsPage nor isPromoPage is true', () => {
            const layout = {} as ISitecoreLayout;
            const offer = {} as IOffer;

            const result = getVideoData({
                isSearchResultsPage: false,
                isPromoPage: false,
                layout,
                offer,
            });

            expect(result).toEqual({
                youtubeId: '',
                cloudinaryVideoSrc: '',
                videoPlaceholder: '',
            });
        });

        it('should return video data from layout when isSearchResultsPage is true', () => {
            const layout = {
                sitecore: {
                    route: {
                        fields: {
                            YoutubeVideoId: { value: 'layout-youtube-id' },
                            VideoPlaceholder: { value: { src: 'layout-placeholder-src' } },
                        },
                    },
                },
            } as ISitecoreLayout;
            const offer = {} as IOffer;

            const result = getVideoData({
                isSearchResultsPage: true,
                isPromoPage: false,
                layout,
                offer,
            });

            expect(result).toEqual({
                youtubeId: 'layout-youtube-id',
                cloudinaryVideoSrc: '',
                videoPlaceholder: 'layout-placeholder-src',
            });
        });

        it('should return video data from offer when layout data is not available and isPromoPage is true', () => {
            const layout = {} as ISitecoreLayout;
            const offer = {
                hotel: {
                    youtubeVideoId: 'offer-youtube-id',
                    cloudinaryVideoSrc: 'offer-cloudinary-src',
                    videoPlaceholder: 'offer-placeholder-src',
                },
            } as IOffer;

            jest.spyOn(cmsUrls, 'media').mockReturnValue('offer-placeholder-url');

            const result = getVideoData({
                isSearchResultsPage: false,
                isPromoPage: true,
                layout,
                offer,
            });

            expect(result).toEqual({
                youtubeId: 'offer-youtube-id',
                cloudinaryVideoSrc: 'offer-cloudinary-src',
                videoPlaceholder: 'offer-placeholder-url',
            });
        });

        it('should return video data with empty placeholder when no placeholder is available', () => {
            const layout = {} as ISitecoreLayout;
            const offer = {
                hotel: {
                    youtubeVideoId: 'offer-youtube-id',
                    cloudinaryVideoSrc: 'offer-cloudinary-src',
                },
            } as IOffer;

            const result = getVideoData({
                isSearchResultsPage: true,
                isPromoPage: false,
                layout,
                offer,
            });

            expect(result).toEqual({
                youtubeId: 'offer-youtube-id',
                cloudinaryVideoSrc: 'offer-cloudinary-src',
                videoPlaceholder: '',
            });
        });
    });

    describe('getIsSuperDealShownStatus', () => {
        it('should NOT show super-deal when on promo page and HideSuperDeals is applied', () => {
            const isPromoPage = true;
            const pageName = 'promo-page';
            const offer = {} as IOffer;
            const isApplySpecialFilter = jest.fn().mockReturnValue(true);
            const isPillVisible = jest.fn();

            const result = getIsSuperDealShownStatus({
                isPromoPage,
                isApplySpecialFilter,
                pageName,
                offer,
                isPillVisible,
            });

            expect(result).toBe(false);
        });

        it('should show super-deal when offer has distressed flights and country is not listed in hidden settings', () => {
            const isPromoPage = false;
            const pageName = 'promo-page';
            const offer = { hasDistressedFlights: true, hotel: { country: { code: 'US' } } } as IOffer;
            const isApplySpecialFilter = jest.fn();
            const isPillVisible = jest.fn().mockReturnValue(true);

            const result = getIsSuperDealShownStatus({
                isPromoPage,
                isApplySpecialFilter,
                pageName,
                offer,
                isPillVisible,
            });

            expect(result).toBe(true);
        });

        it('should NOT show super-deal when offer has distressed flights and country is listed in hidden settings', () => {
            const isPromoPage = false;
            const pageName = 'promo-page';
            const offer = { hasDistressedFlights: true, hotel: { country: { code: 'US' } } } as IOffer;
            const isApplySpecialFilter = jest.fn();
            const isPillVisible = jest.fn().mockReturnValue(false);

            const result = getIsSuperDealShownStatus({
                isPromoPage,
                isApplySpecialFilter,
                pageName,
                offer,
                isPillVisible,
            });

            expect(result).toBe(false);
        });

        it('should NOT show super-deal when offer does not have distressed flights', () => {
            const isPromoPage = false;
            const pageName = 'promo-page';
            const offer = { hasDistressedFlights: false } as IOffer;
            const isApplySpecialFilter = jest.fn();
            const isPillVisible = jest.fn();

            const result = getIsSuperDealShownStatus({
                isPromoPage,
                isApplySpecialFilter,
                pageName,
                offer,
                isPillVisible,
            });

            expect(result).toBe(false);
        });
    });
});
