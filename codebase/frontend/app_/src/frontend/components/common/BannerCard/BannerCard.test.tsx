import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { createMockStores, mockBooking } from 'frontend/__mocks__';
import { mockTokenizer } from 'frontend/__mocks__/utils/tokenizer';
import { mockSitecoreField, mockSitecoreImageField, mockSitecoreLinkField } from 'frontend/utils/tests.utils';
import * as viewBookingUtils from 'frontend/utils/viewBooking.utils';
import { ILivePrice } from 'models/data/ILivePrice';
import { PartnershipComponentThemes } from 'models/enum/PartnershipComponentThemes';
import SitecoreLinkType from 'models/enum/SitecoreLinkType';

import { BannerCard, IBannerCardProps } from './BannerCard';

const createProps = (): IBannerCardProps => ({
    fields: {
        Description: mockSitecoreField('description'),
        Image: mockSitecoreField(mockSitecoreImageField('image')),
        CTA: mockSitecoreField(mockSitecoreLinkField('/{destination}', 'link', SitecoreLinkType.External)),
        Logo: mockSitecoreField(mockSitecoreImageField('logo')),
        Subtitle: mockSitecoreField('subtitle'),
        Title: mockSitecoreField('title'),
        Price: mockSitecoreField('price'),
        PricePrefix: mockSitecoreField('price-prefix'),
    },
    handleClick: jest.fn(),
    theme: PartnershipComponentThemes.Standard,
    wasRerendered: true,
    isLogoBackgroundTransparent: undefined,
    elRef: jest.fn(),
    livePrice: { pricePP: 10 } as ILivePrice,
    isExternalExtras: false,
    index: 1,
});

const createStores = () =>
    createMockStores({
        layoutStore: {
            getPhrase: jest.fn(p => p),
            isEditMode: false,
            isPricesHidden: false,
            isTradePortal: false,
        },
        appStore: {
            isScreenLessMedium: false,
        },
        trackingStore: {
            trackExternalExtrasTileClick: jest.fn(),
        },
        viewBookingStore: {
            booking: mockBooking,
        },
        bookingStore: {
            booking: null,
        },
    });

let mockProps = createProps();
let mockStores = createStores();

jest.mock('frontend/utils/tokenizer', () => ({
    __esModule: true,
    Tokenizer: mockTokenizer,
}));

jest.mock('frontend/components/common/RichTextWithLinks', () => ({
    __esModule: true,
    default: () => <div data-tid='banner-description' />,
}));

const mockRouterLinkProps = jest.fn();
jest.mock('frontend/components/common/RouterLink', () => ({
    __esModule: true,
    default: props => {
        mockRouterLinkProps(props);

        return <button data-tid='banner-link' onClick={props.onClick} />;
    },
}));

const mockPriceContentComponent = jest.fn();

jest.mock('frontend/components/common/BannerCard/components/PriceContent', () => ({
    __esModule: true,
    default: ({ ...props }) => {
        mockPriceContentComponent(props);

        return <div data-tid='price-component' />;
    },
}));

jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useContext: () => mockStores,
}));

const getBookingDestinationForTrackingSpy = jest
    .spyOn(viewBookingUtils, 'getBookingDestinationForTracking')
    .mockReturnValue('spain-tenerife-playa-paraiso');

describe('<BannerCard />', () => {
    beforeEach(() => {
        mockProps = createProps();
        mockStores = createStores();
    });

    it('should render standard', () => {
        render(<BannerCard {...mockProps} />);

        const card = screen.getByTestId('banner-card');
        expect(card).toHaveClass('bannerCardPartnership');
        expect(card).not.toHaveClass('externalExtrasBanner');
        expect(screen.getByTestId('banner-info')).toHaveClass('infoPartnership');
        expect(screen.getByTestId('banner-logo-container')).toHaveClass('logoContainer');
        expect(screen.getByTestId('banner-subtitle')).toHaveTextContent(mockProps.fields.Subtitle.value);
        expect(screen.getByTestId('banner-title')).toHaveTextContent(mockProps.fields.Title.value);
        expect(screen.getByTestId('banner-description')).toBeInTheDocument();
        expect(screen.getByTestId('banner-logo')).toBeInTheDocument();
        expect(screen.getByTestId('banner-link')).toBeInTheDocument();

        expect(mockRouterLinkProps).toHaveBeenCalledWith({
            link: {
                value: {
                    ...mockProps.fields.CTA.value,
                    href: '/{destination} spain-tenerife-playa-paraiso',
                },
            },
            onClick: mockProps.handleClick,
            className: 'button btn--outlined',
            'data-tid': 'banner-link-button',
            children: mockProps.fields.CTA.value.text,
        });
        expect(screen.getByTestId('price-component')).toBeInTheDocument();

        expect(mockPriceContentComponent).toHaveBeenCalledWith({
            link: {
                value: {
                    ...mockProps.fields.CTA.value,
                    href: '/{destination} spain-tenerife-playa-paraiso',
                },
            },
            livePrice: mockProps.livePrice,
            price: mockProps.fields.Price,
            pricePrefix: mockProps.fields.PricePrefix,
            isExternalExtras: mockProps.isExternalExtras,
        });

        expect(mockStores.trackingStore.trackExternalExtrasTileClick).not.toHaveBeenCalled();
    });

    it('should NOT render Partnership scss classes and render ExternalExtras scss classes when isExternalExtras = true', () => {
        mockProps.isExternalExtras = true;

        render(<BannerCard {...mockProps} />);

        const card = screen.getByTestId('banner-card');
        expect(card).not.toHaveClass('bannerCardPartnership');
        expect(card).toHaveClass('externalExtrasBanner');
        expect(screen.getByTestId('banner-info')).not.toHaveClass('infoPartnership');
        expect(screen.getByTestId('banner-logo')).toHaveClass('logoExternalExtras');
    });

    it('should NOT render banner-logo-container and banner-logo when logo is not defined', () => {
        (mockProps as any).fields.Logo = undefined;

        render(<BannerCard {...mockProps} />);

        expect(screen.queryByTestId('banner-logo')).not.toBeInTheDocument();
        expect(screen.queryByTestId('banner-logo-container')).not.toBeInTheDocument();
    });

    it('should render different styling if childrenCount is less than 3', () => {
        mockProps.childrenCount = 2;

        render(<BannerCard {...mockProps} />);

        expect(screen.getByTestId('banner-card')).toHaveClass('bannerCardTwoOrLess');
    });

    it('should contain isGridBanner and isSingleGridItemOnRow classNames when props isGridBanner and isSingleGridItemOnRow are true', () => {
        mockProps.isGridBanner = true;
        mockProps.isSingleGridItemOnRow = true;

        render(<BannerCard {...mockProps} />);

        const card = screen.getByTestId('banner-card');
        expect(card).toHaveClass('gridBanner');
        expect(card).toHaveClass('singleGridItemOnRow');
    });

    describe('<RouterLink />', () => {
        it('should NOT render class for RouterLink if theme is WithoutLivePrice', () => {
            mockProps.theme = PartnershipComponentThemes.WithoutLivePrice;

            render(<BannerCard {...mockProps} />);

            expect(mockRouterLinkProps).toHaveBeenCalledWith(
                expect.objectContaining({
                    className: 'button',
                }),
            );
        });

        it('should execute click on link', async () => {
            mockProps.theme = PartnershipComponentThemes.WithoutLivePrice;

            render(<BannerCard {...mockProps} />);

            await userEvent.click(screen.getByTestId('banner-link'));

            expect(mockProps.handleClick).toHaveBeenCalled();
        });
    });

    describe('<PriceContent />', () => {
        it('should render PriceContent on Holidays', () => {
            mockStores.layoutStore.isPricesHidden = false;
            mockStores.layoutStore.isTradePortal = false;

            render(<BannerCard {...mockProps} />);

            expect(screen.getByTestId('price-component')).toBeInTheDocument();
        });

        it('should render PriceContent when isPricesHidden is NOT toggled on Trade Portal', () => {
            mockStores.layoutStore.isPricesHidden = false;
            mockStores.layoutStore.isTradePortal = true;

            render(<BannerCard {...mockProps} />);

            expect(screen.queryByTestId('price-component')).toBeInTheDocument();
        });

        it('should NOT render PriceContent when isPricesHidden is toggled on Trade Portal', () => {
            mockStores.layoutStore.isPricesHidden = true;
            mockStores.layoutStore.isTradePortal = true;

            render(<BannerCard {...mockProps} />);

            expect(screen.queryByTestId('price-component')).not.toBeInTheDocument();
        });

        it('should NOT render PriceContent if price or pricePrefix is not defined', () => {
            (mockProps as any).livePrice = undefined;
            (mockProps as any).fields.PricePrefix = undefined;

            render(<BannerCard {...mockProps} />);

            expect(screen.queryByTestId('price-component')).not.toBeInTheDocument();
        });
    });

    describe('Tracking', () => {
        it('should trigger tracking event on banner click and pass price from sitecore', async () => {
            render(<BannerCard {...mockProps} />);

            await userEvent.click(screen.getByTestId('banner-card'));

            expect(mockStores.trackingStore.trackExternalExtrasTileClick).toHaveBeenCalledWith(
                mockProps.fields.Title.value,
                mockProps.index + 1,
                mockProps.fields.Price.value,
                '/{destination} spain-tenerife-playa-paraiso',
            );
        });

        it('should trigger tracking event on banner click and pass liveprice', async () => {
            mockProps.livePrice = { price: 20 } as ILivePrice;
            render(<BannerCard {...mockProps} />);

            await userEvent.click(screen.getByTestId('banner-card'));

            expect(mockStores.trackingStore.trackExternalExtrasTileClick).toHaveBeenCalledWith(
                mockProps.fields.Title.value,
                mockProps.index + 1,
                String(mockProps.livePrice.price),
                '/{destination} spain-tenerife-playa-paraiso',
            );
        });
    });

    it('should use bookingStore.booking as fallback when viewBookingStore.booking is null', () => {
        mockStores.viewBookingStore.booking = null;
        mockStores.bookingStore.booking = mockBooking;

        render(<BannerCard {...mockProps} />);

        expect(getBookingDestinationForTrackingSpy).toHaveBeenCalledWith(mockStores.bookingStore.booking);
    });
});
