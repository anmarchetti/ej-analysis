import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';

import BannerBrightnessType from 'models/enum/banners/BrightnessType';
import BannerCTAType from 'models/enum/banners/CTAType';
import BannerTextColor from 'models/enum/banners/TextColor';

import ColoredStripeCountdownBanner from './ColoredStripeCountdownBanner';

jest.mock('@sitecore-jss/sitecore-jss-nextjs', () => ({
    ...jest.requireActual('@sitecore-jss/sitecore-jss-nextjs'),
    Text: jest.fn(({ field, tag: Tag = 'span', className, ...rest }) => (
        <Tag className={className} data-tid={`jss-text-${field?.value || 'empty'}`} {...rest}>
            {field?.value}
        </Tag>
    )),
}));

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
    <a href={link?.value?.href || '#'} className={className} onClick={onClick} data-tid='router-link'>
        {children}
    </a>
));

describe('<ColoredStripeCountdownBanner />', () => {
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
                AnchorText: { value: 'Anchor' },
                AnchorLink: { value: { href: '#anchor' } },
                IsAnchorLinkToForm: { value: false },
                BackgroundColor: { value: '' },
                AnimationClassName: { value: '' },
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
            isTransparent: false,
            backgroundStyles: { backgroundColor: 'blue' },
            onClickButton: jest.fn(),
            onClickComponent: jest.fn(),
            isLower: false,
            singleSlide: false,
            rendering: { componentName: 'ColoredStripeCountdownBanner', dataSource: '{GUID}' },
        } as any);

    let mocks = resetMocks();

    beforeEach(() => {
        mocks = resetMocks();
    });

    it('Should return null when fields is not defined', () => {
        mocks.fields = null;

        const { container } = render(<ColoredStripeCountdownBanner {...mocks} />);

        expect(container).toBeEmptyDOMElement();
    });

    it('should perform standard render with default props', () => {
        const { container } = render(<ColoredStripeCountdownBanner {...mocks} />);

        const mainBanner = container.firstChild;

        expect(mainBanner).toHaveClass('hero-banner', 'countdown-banner', 'countdown-banner__orange');
        expect(screen.getByText(mocks.fields.IntroTitle.value as string)).toBeInTheDocument();
        expect(screen.getByTestId('rich-text-with-links')).toHaveTextContent(mocks.fields.Title.value as string);
        expect(screen.getByText(mocks.fields.Subtitle.value as string)).toBeInTheDocument();

        const ctaLinks = screen.getAllByTestId('router-link');

        expect(ctaLinks.length).toBe(2);
        ctaLinks.forEach(link => {
            expect(link).toHaveTextContent(mocks.fields.CTA.value.text);
            expect(link).toHaveAttribute('href', mocks.fields.CTA.value.href);
        });
        expect(screen.getAllByTestId('countdown').length).toBe(2);
        expect(screen.getByText(mocks.fields.CountdownLabel.value as string)).toBeInTheDocument(); // For desktop

        expect(screen.getByTestId('credit-anchor')).toBeInTheDocument();
    });

    it('should render banner div with `countdown-banner__transparent` className when isTransparent enabled', () => {
        mocks.isTransparent = true;

        const { container } = render(<ColoredStripeCountdownBanner {...mocks} />);

        expect(container.firstChild).toHaveClass('hero-banner', 'countdown-banner', 'countdown-banner__transparent');
        expect(container.firstChild).not.toHaveClass('countdown-banner__orange');
    });

    it('should render banner div with `low` className when isLower enabled', () => {
        mocks.isLower = true;
        const { container } = render(<ColoredStripeCountdownBanner {...mocks} />);
        expect(container.firstChild).toHaveClass('low');
    });

    it('should render banner div with `single-slide` className when singleSlide enabled', () => {
        mocks.singleSlide = true;

        const { container } = render(<ColoredStripeCountdownBanner {...mocks} />);

        expect(container.firstChild).toHaveClass('single-slide');
    });

    it('should NOT render RichTextWithLinks for title when Title field is null', () => {
        mocks.fields.Title = null;

        render(<ColoredStripeCountdownBanner {...mocks} />);

        expect(screen.queryByTestId('rich-text-with-links')).not.toBeInTheDocument();
    });

    it('should NOT render RichTextWithLinks for title when Title.value is empty', () => {
        mocks.fields.Title = { value: '' };

        render(<ColoredStripeCountdownBanner {...mocks} />);

        expect(screen.queryByTestId('rich-text-with-links')).not.toBeInTheDocument();
    });

    it('should NOT render RouterLink for CTA when CTA field is null', () => {
        const originalCtaText = mocks.fields.CTA.value.text;
        mocks.fields.CTA = null;

        render(<ColoredStripeCountdownBanner {...mocks} />);

        expect(screen.queryByTestId('router-link')).not.toBeInTheDocument();
        expect(screen.queryByText(originalCtaText)).not.toBeInTheDocument();
    });

    it('should NOT render RouterLink for CTA when CTA.value.href is empty', () => {
        const originalCtaText = mocks.fields.CTA.value.text;
        mocks.fields.CTA = { value: { href: '', text: 'CTA Text' } };

        render(<ColoredStripeCountdownBanner {...mocks} />);

        expect(screen.queryByTestId('router-link')).not.toBeInTheDocument();
        expect(screen.queryByText(originalCtaText)).not.toBeInTheDocument();
        expect(screen.queryByText('CTA Text')).not.toBeInTheDocument();
    });

    it('should NOT render countdown label text when CountdownLabel field is null', () => {
        const originalLabelText = mocks.fields.CountdownLabel.value;
        mocks.fields.CountdownLabel = null;

        render(<ColoredStripeCountdownBanner {...mocks} />);

        expect(screen.queryByText(originalLabelText as string)).not.toBeInTheDocument();
    });

    it('should NOT render countdown label text when CountdownLabel.value is empty', () => {
        const originalLabelText = mocks.fields.CountdownLabel.value;
        mocks.fields.CountdownLabel = { value: '' };

        render(<ColoredStripeCountdownBanner {...mocks} />);

        expect(screen.queryByText(originalLabelText as string)).not.toBeInTheDocument();
    });

    it('should call onClickComponent when the main banner is clicked', () => {
        const { container } = render(<ColoredStripeCountdownBanner {...mocks} />);
        const mainBanner = container.firstChild as HTMLElement;

        fireEvent.click(mainBanner);

        expect(mocks.onClickComponent).toHaveBeenCalledTimes(1);
    });

    it('should call onClickButton with correct arguments when a CTA button is clicked', () => {
        render(<ColoredStripeCountdownBanner {...mocks} />);

        const ctaLinks = screen.getAllByTestId('router-link');
        fireEvent.click(ctaLinks[0]);

        expect(mocks.onClickButton).toHaveBeenCalledTimes(1);
        expect(mocks.onClickButton).toHaveBeenCalledWith(expect.any(Object), mocks.fields.CTA);
    });
});
