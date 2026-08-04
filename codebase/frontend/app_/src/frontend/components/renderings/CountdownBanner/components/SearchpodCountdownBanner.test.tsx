import React from 'react';
import { render } from '@testing-library/react';

import { createMockStores } from 'frontend/__mocks__/createMockStores';
import BannerBrightnessType from 'models/enum/banners/BrightnessType';
import BannerCTAType from 'models/enum/banners/CTAType';
import BannerTextColor from 'models/enum/banners/TextColor';

import SearchpodCountdownBanner from './SearchpodCountdownBanner';

jest.mock('./Countdown', () => ({
    __esModule: true,
    default: () => <div data-tid='countdown' />,
}));

jest.mock('frontend/components/common/CreditAnchor/CreditAnchor', () => ({
    __esModule: true,
    default: () => <div data-tid='credit-anchor' />,
}));

const createStores = () =>
    createMockStores({
        layoutStore: {
            isTradePortal: false,
            isEditMode: false,
            basePath: '/en',
        },
        routerStore: {
            redirectTo: jest.fn(),
        },
        appStore: {
            toggleOfferConditions: jest.fn(),
        },
        trackingStore: {
            trackValidation: jest.fn(),
        },
    });

const mockStores = createStores();

jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useContext: () => mockStores,
}));

describe('<SearchpodCountdownBanner />', () => {
    const resetMocks = () =>
        ({
            fields: {
                Image: { value: { src: 'image' } },
                Title: { value: 'Title' },
                Subtitle: { value: 'Subtitle' },
                CTA: { value: { href: 'href', text: 'text' } },
                Brightness: BannerBrightnessType.Light,
                TextColor: BannerTextColor.Black,
                CTAType: BannerCTAType.Orange,
                MobileOnlyImage: { value: { src: 'MobileOnlyImage' } },
                CountdownVariant: { value: undefined },
                CountdownLabel: { value: 'CountdownLabel' },
                IntroTitle: { value: 'IntroTitle' },
                DateTime: { value: 'DateTime' },
                HideAfterTimeElapsed: { value: 'HideAfterTimeElapsed' },
            },
            time: [
                {
                    value: 1,
                    label: 'label1',
                },
                {
                    value: 2,
                    label: 'label2',
                },
            ],
        } as any);

    let mocks = resetMocks();

    beforeEach(() => {
        mocks = resetMocks();
    });

    it('should render', () => {
        const { container, getByTestId } = render(<SearchpodCountdownBanner {...mocks} />);

        expect(
            container.querySelector('.hero-banner.countdown-banner.countdown-banner--centered-content'),
        ).toBeTruthy();
        expect(container.querySelector('.countdown-banner__image')).toBeTruthy();
        expect(container.querySelector('.wrapper-container.wrapper-container--px')).toBeTruthy();
        expect(container.querySelector('.countdown-banner__title')).toBeTruthy();
        expect(container.querySelector('.countdown-banner__subtitle')).toBeTruthy();
        expect(container.querySelector('.countdown-block .countdown-block__text')).toBeTruthy();
        expect(getByTestId('countdown')).toBeInTheDocument();
        expect(container.querySelector('.countdown-banner__btn')).toBeTruthy();
        expect(getByTestId('credit-anchor')).toBeInTheDocument();
    });

    it('should render banner div with `low` className when isLower enabled', () => {
        mocks.isLower = true;

        const { container } = render(<SearchpodCountdownBanner {...mocks} />);

        expect(container.querySelector('.hero-banner.low')).toBeTruthy();
    });

    it('should render wrapper-container div with `single-slide` className when singleSlide enabled', () => {
        mocks.singleSlide = true;

        const { container } = render(<SearchpodCountdownBanner {...mocks} />);

        expect(container.querySelector('.wrapper-container.single-slide')).toBeTruthy();
    });

    it('should render banner div with `brightness-dark` className when Brightness set to Dark value', () => {
        mocks.fields.Brightness = { value: BannerBrightnessType.Dark };

        const { container } = render(<SearchpodCountdownBanner {...mocks} />);

        expect(container.querySelector('.hero-banner.brightness-dark')).toBeTruthy();
    });

    it('should not render title when Title field not defined', () => {
        mocks.fields.Title = null;

        const { container } = render(<SearchpodCountdownBanner {...mocks} />);

        expect(container.querySelector('.countdown-banner__title')).toBeNull();
    });

    it('should not render subtitle when Subtitle field not defined', () => {
        mocks.fields.Subtitle = null;

        const { container } = render(<SearchpodCountdownBanner {...mocks} />);

        expect(container.querySelector('.countdown-banner__subtitle')).toBeNull();
    });

    it('should not render countdown label when CountdownLabel field not defined', () => {
        mocks.fields.CountdownLabel = null;

        const { container } = render(<SearchpodCountdownBanner {...mocks} />);

        expect(container.querySelector('.countdown-block__text')).toBeNull();
    });

    describe('Text Color', () => {
        it('should render wrapper-container with `orange` className when TextColor set to Orange value', () => {
            mocks.fields.TextColor = { value: BannerTextColor.Orange };

            const { container } = render(<SearchpodCountdownBanner {...mocks} />);

            expect(container.querySelector('.wrapper-container.text-color--orange')).toBeTruthy();
        });

        it('should render wrapper-container with `black` className when TextColor set to Black value', () => {
            mocks.fields.TextColor = { value: BannerTextColor.Black };

            const { container } = render(<SearchpodCountdownBanner {...mocks} />);

            expect(container.querySelector('.wrapper-container.text-color--black')).toBeTruthy();
        });

        it('should render wrapper-container with `white` className when TextColor set to White value', () => {
            mocks.fields.TextColor = { value: BannerTextColor.White };

            const { container } = render(<SearchpodCountdownBanner {...mocks} />);

            expect(container.querySelector('.wrapper-container.text-color--white')).toBeTruthy();
        });

        it('should render wrapper-container with `grey` className when TextColor set to Grey value', () => {
            mocks.fields.TextColor = { value: BannerTextColor.Grey };

            const { container } = render(<SearchpodCountdownBanner {...mocks} />);

            expect(container.querySelector('.wrapper-container.text-color--grey')).toBeTruthy();
        });
    });

    describe('CTA', () => {
        it('should render button with `orange` className when CTAType set to Orange value', () => {
            mocks.fields.CTAType = { value: BannerCTAType.Orange };

            const { container } = render(<SearchpodCountdownBanner {...mocks} />);

            expect(container.querySelector('.countdown-banner__btn.orange')).toBeTruthy();
        });

        it('should render button with `white` className when CTAType set to White value', () => {
            mocks.fields.CTAType = { value: BannerCTAType.White };

            const { container } = render(<SearchpodCountdownBanner {...mocks} />);

            expect(container.querySelector('.countdown-banner__btn.white')).toBeTruthy();
        });

        it('should not render button link when CTA field not defined', () => {
            mocks.fields.CTA = null;

            const { container } = render(<SearchpodCountdownBanner {...mocks} />);

            expect(container.querySelector('.countdown-banner__btn')).toBeNull();
        });
    });
});
