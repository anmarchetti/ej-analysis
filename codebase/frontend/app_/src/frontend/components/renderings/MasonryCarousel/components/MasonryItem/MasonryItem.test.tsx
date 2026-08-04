import React from 'react';
import { render, screen } from '@testing-library/react';

import { CurrencyCode } from 'code/currency';
import { createMockStores } from 'frontend/__mocks__';
import { useXSMobileViewport } from 'frontend/hooks/useMediaQuery';
import { MediaSize } from 'models/data/MediaSizeParams';
import { IDestinationWithPrice } from 'frontend/components/renderings/MasonryCarousel/MasonryCarousel';

import { IMasonryItemProps, MasonryItem } from './MasonryItem';

jest.mock('frontend/hooks/useMediaQuery', () => ({
    __esModule: true,
    useMoreThenMobileViewport: jest.fn(),
    useXSMobileViewport: jest.fn(),
}));

jest.mock('frontend/hooks/usePriceLabels', () => () => ({
    labelBeforePrice: 'from',
    labelAfterPrice: 'pp',
}));

const mockRouterLinkProps = jest.fn();
jest.mock('frontend/components/common/RouterLink', () => ({
    __esModule: true,
    default: ({ children, link, ...rest }) => {
        mockRouterLinkProps({ link, ...rest });

        return <div>{children}</div>;
    },
}));

jest.mock('frontend/components/common/Callout/Callout', () => () => <div data-tid='callout' />);

jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useContext: () => mockStores,
}));

const mockJSSNextImageProps = jest.fn();
jest.mock('frontend/components/common/JSSImageNext/JSSImageNext', () => ({
    __esModule: true,
    JSSImageNext: props => {
        mockJSSNextImageProps(props);

        return <div data-tid='jss-next-image' />;
    },
}));

const mockFormatMoneyWithTouristTax = jest.fn();
jest.mock('frontend/utils/touristTax.utils', () => ({
    __esModule: true,
    formatMoneyWithTouristTax: (...params) => mockFormatMoneyWithTouristTax(...params),
}));

const resetMocks = (): IMasonryItemProps => ({
    item: {
        fields: {
            Image: { value: { src: 'test' } },
            Name: { value: 'test' },
        },
        pricePP: 100,
        touristTaxPP: 10,
        pricePPExcludingTouristTax: 90,
        currency: CurrencyCode.GBP,
        isPriceValid: true,
    } as IDestinationWithPrice,
    isUnavailable: false,
});

let mocks: IMasonryItemProps;
let mockStores;

describe('<MasonryItem />', () => {
    beforeEach(() => {
        mocks = resetMocks();
        mockStores = createMockStores({
            appStore: { isScreenMedium: false },
            layoutStore: {
                currentPath: '',
                isDestinationUnavailableBannerEnabled: false,
                isVirtualRegionBrowsePage: false,
                isVirtualResortBrowsePage: false,
                isTouristTaxEnabled: true,
            },
            marketStore: { getCurrencySymbol: jest.fn(() => `£`) },
        });
        mockFormatMoneyWithTouristTax.mockReturnValue(110);
        mockRouterLinkProps.mockReset();
    });

    it('Should render with unavailable banner', () => {
        mocks.isUnavailable = true;
        mockStores.layoutStore.isDestinationUnavailableBannerEnabled = true;
        delete mocks.item.pricePP;

        render(<MasonryItem {...mocks} />);

        expect(screen.getByTestId('unavailable-banner')).toBeInTheDocument();
    });

    it('Should render without unavailable banner', () => {
        mockStores.layoutStore.isDestinationUnavailableBannerEnabled = true;

        render(<MasonryItem {...mocks} />);

        expect(screen.queryByTestId('unavailable-banner')).not.toBeInTheDocument();
    });

    it('Should render without unavailable banner if setting is turn off', () => {
        mocks.isUnavailable = true;

        render(<MasonryItem {...mocks} />);

        expect(screen.queryByTestId('unavailable-banner')).not.toBeInTheDocument();
    });

    it('Should render without unavailable banner when live price is provided', () => {
        mocks.isUnavailable = true;
        mockStores.layoutStore.isDestinationUnavailableBannerEnabled = true;

        render(<MasonryItem {...mocks} />);

        expect(screen.queryByTestId('unavailable-banner')).not.toBeInTheDocument();
    });

    describe('JSSNextImage', () => {
        it('Should render JSSImage', () => {
            mocks.mediaSize = MediaSize.Large;

            render(<MasonryItem {...mocks} />);

            expect(screen.getByTestId('jss-next-image')).toBeInTheDocument();
            expect(mockJSSNextImageProps).toHaveBeenCalledWith(
                expect.objectContaining({
                    field: mocks.item.fields.Image,
                    mediaSize: MediaSize.Large,
                    fill: true,
                }),
            );
        });

        it('Should render JSSImage on mobile viewport', () => {
            jest.mocked(useXSMobileViewport).mockReturnValue(true);
            mocks.mediaSize = MediaSize.Large;

            render(<MasonryItem {...mocks} />);

            expect(mockJSSNextImageProps).toHaveBeenCalledWith(
                expect.objectContaining({
                    field: mocks.item.fields.Image,
                    mediaSize: MediaSize.Small,
                    fill: true,
                }),
            );
        });
    });

    describe('price block', () => {
        it('should render price block', () => {
            render(<MasonryItem {...mocks} />);

            expect(screen.getByTestId('price-block')).toBeInTheDocument();
            expect(mockFormatMoneyWithTouristTax).toHaveBeenCalledWith(
                mocks.item.pricePP,
                mocks.item.pricePPExcludingTouristTax,
                mockStores.layoutStore.isTouristTaxEnabled,
                mockStores.marketStore.formatMoney,
                {
                    maximumFractionDigits: 0,
                    hideCurrencySymbol: true,
                },
            );
        });

        it('should render price block with duration when isNumberOfNightsLabel is true', () => {
            mocks.isNumberOfNightsLabel = true;

            render(<MasonryItem {...mocks} />);

            expect(screen.queryByTestId('price-block')).not.toBeInTheDocument();
            expect(screen.queryByTestId('price-block-with-duration')).toBeInTheDocument();
            expect(mockFormatMoneyWithTouristTax).toHaveBeenCalledWith(
                mocks.item.pricePP,
                mocks.item.pricePPExcludingTouristTax,
                mockStores.layoutStore.isTouristTaxEnabled,
                mockStores.marketStore.formatMoney,
                {
                    maximumFractionDigits: 0,
                },
            );
        });

        it('should render price block with duration when item has duration', () => {
            mocks.item.duration = 7;

            render(<MasonryItem {...mocks} />);

            expect(screen.queryByTestId('price-block')).not.toBeInTheDocument();
            expect(screen.queryByTestId('price-block-with-duration')).toBeInTheDocument();
            expect(mockFormatMoneyWithTouristTax).toHaveBeenCalledWith(
                mocks.item.pricePP,
                mocks.item.pricePPExcludingTouristTax,
                mockStores.layoutStore.isTouristTaxEnabled,
                mockStores.marketStore.formatMoney,
                {
                    maximumFractionDigits: 0,
                },
            );
        });

        it('should not render price block with duration when price is not shown and item has duration', () => {
            mocks.isNumberOfNightsLabel = true;
            delete mocks.item.pricePP;

            render(<MasonryItem {...mocks} />);

            expect(screen.queryByTestId('price-block-with-duration')).not.toBeInTheDocument();
        });

        it('should not render price block when price is not defined', () => {
            delete mocks.item.pricePP;

            render(<MasonryItem {...mocks} />);

            expect(screen.queryByTestId('price-block')).not.toBeInTheDocument();
        });
    });

    describe('isFeaturedHotelVariant', () => {
        it('should apply featured hotel class to RouterLink', () => {
            mocks.isFeaturedHotelVariant = true;

            render(<MasonryItem {...mocks} />);

            expect(mockRouterLinkProps).toHaveBeenCalledWith(
                expect.objectContaining({ className: 'masonry-item masonryItemFeaturedHotel' }),
            );
        });

        it('should not apply featured hotel class when isFeaturedHotelVariant is false', () => {
            render(<MasonryItem {...mocks} />);

            expect(mockRouterLinkProps).toHaveBeenCalledWith(expect.objectContaining({ className: 'masonry-item' }));
        });
    });
});
