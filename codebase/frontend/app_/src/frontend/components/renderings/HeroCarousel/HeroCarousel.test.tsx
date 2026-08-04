import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';

import { getMockedBannerFields } from 'frontend/__mocks__/heroBanners';
import { mockSitecoreField } from 'frontend/utils/tests.utils';
import { IHeroBannerItem } from 'models/data/IHeroBannerFields';
import CountdownBannerVariant from 'models/enum/CountdownBannerVariant';
import { ISitecoreComponent } from 'models/sitecore/generic/ISitecoreComponent';

import { HeroCarousel, IHeroCarouselProps } from './HeroCarousel';

const mockItem: IHeroBannerItem = {
    fields: getMockedBannerFields(),
};

const mockCountdownBannerComponent = jest.fn();
jest.mock('frontend/components/renderings/CountdownBanner/CountdownBanner', () => ({
    __esModule: true,
    default: props => {
        mockCountdownBannerComponent(props);

        return <div data-tid='countdown-banner' onClick={() => props.toggleShowCountdownBanner(false)} />;
    },
}));

const mockGenericHeroBannerComponent = jest.fn();
jest.mock('frontend/components/renderings/GenericHeroBanner/GenericHeroBanner', () => ({
    __esModule: true,
    default: props => {
        mockGenericHeroBannerComponent(props);

        return <div data-tid='generic-hero-banner' />;
    },
}));

jest.mock('@sitecore-jss/sitecore-jss-nextjs', () => ({
    Placeholder: ({ name }) => <div data-tid={`placeholder-${name}`} />,
}));

const mockImageGallery = jest.fn();
jest.mock('react-image-gallery', () => ({
    __esModule: true,
    default: ({ renderItem, onSlide, items, ...props }) => {
        mockImageGallery({ ...props, items });

        return (
            <div data-tid='image-gallery'>
                {items.map(item => renderItem(item))}
                <button onClick={onSlide} onKeyDown={jest.fn()} data-tid='image-gallery-on-slide-button' />
            </div>
        );
    },
}));

const resetMocks = (): IHeroCarouselProps => ({
    fields: {
        items: [mockItem, mockItem],
    },
    params: {
        Duration: 5000,
    },
    rendering: { uid: '56ab96ca-e432-4985-bd6e-1446ed0ac1e5' } as ISitecoreComponent['rendering'],
    isScreenMedium: false,
    isEditMode: false,
    wasRerendered: false,
    trackHeroBannerImpression: jest.fn(),
});

let mocks;

describe('HeroCarousel', () => {
    beforeEach(() => {
        mocks = resetMocks();
    });

    it('should render standard', () => {
        render(<HeroCarousel {...mocks} />);

        expect(screen.getByTestId('image-gallery')).toBeInTheDocument();
        expect(screen.queryByTestId('placeholder-floating-searchpod')).not.toBeInTheDocument();
    });

    it('should NOT render HeroCarousel when items are not defined', () => {
        mocks.fields.items = [];
        render(<HeroCarousel {...mocks} />);

        expect(screen.queryByTestId('image-gallery')).not.toBeInTheDocument();
    });

    it('should NOT render when no fields', () => {
        mocks.fields = undefined;
        const { container } = render(<HeroCarousel {...mocks} />);

        expect(container).toBeEmptyDOMElement();
    });

    it('speed should return speed from params', () => {
        render(<HeroCarousel {...mocks} />);

        expect(mockImageGallery).toHaveBeenCalledWith(
            expect.objectContaining({
                slideInterval: 5000,
            }),
        );
    });

    it('speed should return default value when no params', () => {
        mocks.params = null;
        render(<HeroCarousel {...mocks} />);

        expect(mockImageGallery).toHaveBeenCalledWith(
            expect.objectContaining({
                slideInterval: 2000,
            }),
        );
    });

    it('should show bullets when there are multiple items', () => {
        render(<HeroCarousel {...mocks} />);

        expect(mockImageGallery).toHaveBeenCalledWith(
            expect.objectContaining({
                showBullets: true,
            }),
        );
    });

    it('should hide bullets when items contains expired countdown banner & itemsToShow length is 1', () => {
        const countdownItem = {
            fields: {
                CountdownVariant: mockSitecoreField(CountdownBannerVariant.FullImage),
                HideAfterTimeElapsed: mockSitecoreField(true),
            },
        };

        mocks.fields.items = [mockItem, countdownItem];
        const { rerender } = render(<HeroCarousel {...mocks} />);

        fireEvent.click(screen.getByTestId('countdown-banner'));

        rerender(<HeroCarousel {...mocks} />);

        expect(mockImageGallery).toHaveBeenCalledWith(
            expect.objectContaining({
                showBullets: false,
            }),
        );
    });

    it('should call trackHeroBannerImpression for each item on mount', () => {
        mocks.wasRerendered = true;

        render(<HeroCarousel {...mocks} />);

        expect(mocks.trackHeroBannerImpression).toHaveBeenCalledTimes(mocks.fields.items.length);
    });

    it('should call trackHeroBannerImpression once with expected params when item count is 1', () => {
        mocks.wasRerendered = true;
        mocks.fields.items = [mockItem];

        render(<HeroCarousel {...mocks} />);

        expect(mocks.trackHeroBannerImpression).toHaveBeenCalledTimes(1);
        expect(mocks.trackHeroBannerImpression).toHaveBeenCalledWith(
            '56ab96ca-e432-4985-bd6e-1446ed0ac1e5',
            'Title',
            'Subtitle',
            1,
        );
    });

    it('should render  GenericHeroBanner', () => {
        mocks.fields.items = [mockItem];
        render(<HeroCarousel {...mocks} />);

        expect(screen.getByTestId('generic-hero-banner')).toBeInTheDocument();
        expect(mockGenericHeroBannerComponent).toHaveBeenCalledWith(
            expect.objectContaining({
                isLower: false,
                fields: mocks.fields.items[0].fields,
                singleSlide: true,
            }),
        );
    });

    it('should render CountdownBanner ', () => {
        mocks.fields.items = [{ ...mockItem, fields: { ...mockItem.fields, CountdownVariant: 1 } }];
        render(<HeroCarousel {...mocks} />);

        expect(screen.getByTestId('countdown-banner')).toBeInTheDocument();
        expect(mockCountdownBannerComponent).toHaveBeenCalledWith(
            expect.objectContaining({
                isLower: false,
                fields: mocks.fields.items[0].fields,
                singleSlide: true,
            }),
        );
    });

    it('should pass isLower prop as true when isBannerLower is true', () => {
        mocks.isBannerLower = true;
        render(<HeroCarousel {...mocks} />);

        expect(mockGenericHeroBannerComponent).toHaveBeenCalledWith(
            expect.objectContaining({
                isLower: true,
            }),
        );
    });
});
