import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';

import BannerBrightnessType from 'models/enum/banners/BrightnessType';
import BannerCTAType from 'models/enum/banners/CTAType';
import BannerTextColor from 'models/enum/banners/TextColor';

import FullImageCountdownBanner from './FullImageCountdownBanner';

jest.mock('frontend/components/common/CreditAnchor/CreditAnchor', () => ({ fields, isPillStyle }) => (
    <div data-tid='credit-anchor' data-ispillstyle={isPillStyle}>
        Credit Anchor Mock - Title: {fields?.Title?.value}
    </div>
));

jest.mock('frontend/components/common/RichTextWithLinks', () => ({ field }) => (
    <div data-tid='rich-text-with-links'>{field?.value}</div>
));

jest.mock('./Countdown', () => ({ time }) => <div data-tid='countdown'>Countdown Mock - Items: {time?.length}</div>);

jest.mock('frontend/components/common/RouterLink', () => ({ link, children, className, onClick }) => (
    <a href={link?.value?.href || '#'} className={className} onClick={onClick} data-testid='router-link'>
        {children}
    </a>
));

const createStores = () => ({
    layoutStore: { isEditMode: false, sitePath: 'sitePath' },
    routerStore: { redirectTo: jest.fn() },
    trackingStore: {
        trackHompageAction: jest.fn(),
    },
    appStore: {
        toggleOfferConditions: jest.fn(),
    },
    queryParamStore: {
        buildRedirectUrlQuery: jest.fn(),
    },
    userStore: {
        setLogInTabActive: jest.fn(),
    },
});

let mockStores;

jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useContext: () => mockStores,
}));

describe('<FullImageCountdownBanner />', () => {
    const defaultOnClickComponent = jest.fn();
    const defaultOnClickButton = jest.fn();

    const resetMocks = () =>
        ({
            fields: {
                Image: { value: { src: 'image' } },
                Title: { value: 'Title' },
                Subtitle: { value: 'Subtitle' },
                CTA: { value: { text: 'CTA', href: 'test-link' } },
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
            backgroundStyles: { backgroundColor: 'blue' },
            onClickComponent: defaultOnClickComponent,
            onClickButton: defaultOnClickButton,
        } as any);

    let mocks = resetMocks();

    beforeEach(() => {
        mocks = resetMocks();
        mockStores = createStores();
    });

    it('should return null when fields is not defined', () => {
        mocks.fields = null;
        const { container } = render(<FullImageCountdownBanner {...mocks} />);

        expect(container.firstChild).toBeNull();
    });

    it('should render with all expected elements', () => {
        const { container } = render(<FullImageCountdownBanner {...mocks} />);

        expect(container.firstChild).toBeInTheDocument();
        expect(container.firstChild).toHaveClass('hero-banner countdown-banner countdown-banner__full-image');
        expect(container.firstChild).toHaveStyle('background-color: blue;');

        // Check for IntroTitle
        expect(screen.getByText(mocks.fields.IntroTitle.value)).toBeInTheDocument();

        // Check for Title
        expect(screen.getByRole('heading', { name: mocks.fields.Title.value })).toBeInTheDocument();

        // Check for Countdown block
        expect(screen.getByTestId('countdown')).toBeInTheDocument();
        expect(screen.getByTestId('countdown')).toHaveTextContent('Countdown Mock - Items: 2');

        // Check for CountdownLabel
        expect(screen.getByText(mocks.fields.CountdownLabel.value)).toBeInTheDocument();
        expect(screen.getByText(mocks.fields.CountdownLabel.value)).toHaveClass('countdown-block__text');
    });

    it('should render banner div with `low` className when isLower enabled', () => {
        mocks.isLower = true;
        const { container } = render(<FullImageCountdownBanner {...mocks} />);
        expect(container.firstChild).toHaveClass('low');
    });

    it('should render banner div with `single-slide` className when singleSlide enabled', () => {
        mocks.singleSlide = true;
        const { container } = render(<FullImageCountdownBanner {...mocks} />);
        expect(container.firstChild).toHaveClass('single-slide');
    });

    it('should NOT render link when CTA field.value.href is not defined', () => {
        mocks.fields.CTA = null;
        const { container } = render(<FullImageCountdownBanner {...mocks} />);
        expect(container.getElementsByClassName('countdown-banner__btn').length).toBe(0);
    });

    it('should render link when CTA field.value.href is defined', () => {
        const { container } = render(<FullImageCountdownBanner {...mocks} />);
        expect(container.getElementsByClassName('countdown-banner__btn').length).toBe(1);
    });

    it('should NOT render countdown label when CountdownLabel field or its value is not defined', () => {
        mocks.fields.CountdownLabel = null;
        const { container } = render(<FullImageCountdownBanner {...mocks} />);
        expect(container.getElementsByClassName('countdown-block__text').length).toBe(0);
    });

    it('should NOT render title when Title field or its value is not defined', () => {
        mocks.fields.Title = null;
        render(<FullImageCountdownBanner {...mocks} />);
        expect(screen.queryByRole('heading')).not.toBeInTheDocument();
    });

    it('should call onClickComponent when the banner is clicked', () => {
        const { container } = render(<FullImageCountdownBanner {...mocks} />);
        const bannerElement = container.firstChild;

        fireEvent.click(bannerElement!);
        expect(mocks.onClickComponent).toHaveBeenCalledTimes(1);
    });

    it('should call onClickButton when the CTA button is clicked', () => {
        const { container } = render(<FullImageCountdownBanner {...mocks} />);
        const ctaButton = container.querySelector('.countdown-banner__btn');

        fireEvent.click(ctaButton!);

        expect(mocks.onClickButton).toHaveBeenCalledTimes(1);
        expect(mocks.onClickButton).toHaveBeenCalledWith(expect.any(Object), mocks.fields.CTA);
    });
});
