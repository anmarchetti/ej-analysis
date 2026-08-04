import React from 'react';
import { render, screen } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';

import { mockSitecoreField } from 'frontend/utils/tests.utils';

import SocialBanner, { TSocialBannerProps } from './SocialBanner';

expect.extend(toHaveNoViolations);

const createProps = (): TSocialBannerProps => ({
    fields: {
        Title: mockSitecoreField('Find us on Social'),
        Subtitle: mockSitecoreField('Find us on Social'),
        Facebook: mockSitecoreField('https://facebook.com/easyjetholidays'),
        Instagram: mockSitecoreField('https://www.instagram.com/easyjetholidays'),
        Twitter: mockSitecoreField('https://x.com/easyjetholidays'),
        YouTube: mockSitecoreField('https://youtube.com/@easyjetholidays'),
        Tiktok: mockSitecoreField('https://tiktok.com/@easyjetholidays'),
        FacebookAriaLabel: mockSitecoreField('Open Facebook'),
        TwitterAriaLabel: mockSitecoreField('Open X'),
        InstagramAriaLabel: mockSitecoreField('Open Instagram'),
        TiktokAriaLabel: mockSitecoreField('Open TikTok'),
        YouTubeAriaLabel: mockSitecoreField('Open Youtube'),
    },
    rendering: {},
    params: {},
});

let props: TSocialBannerProps;

const mockActionCardComponent = jest.fn();

jest.mock('frontend/components/common/ActionCard/ActionCard', () => ({
    __esModule: true,
    default: props => {
        mockActionCardComponent(props);

        return <div>{props.children}</div>;
    },
}));

describe('<SocialBanner />', () => {
    beforeEach(() => {
        props = createProps();
    });

    it('should render the action card component with correct props', () => {
        render(<SocialBanner {...props} />);

        expect(mockActionCardComponent).toHaveBeenCalledWith(
            expect.objectContaining({
                title: props.fields!.Title,
                description: props.fields!.Subtitle,
                dataTid: 'social-banner',
            }),
        );
    });

    it('should open correct facebook link on click', () => {
        render(<SocialBanner {...props} />);

        const link = screen.getByRole('link', { name: props.fields?.FacebookAriaLabel.value });

        expect(link).toHaveAttribute('href', props.fields?.Facebook.value);
    });

    it('should open correct tiktok link on click', () => {
        render(<SocialBanner {...props} />);

        const link = screen.getByRole('link', { name: props.fields?.TiktokAriaLabel.value });

        expect(link).toHaveAttribute('href', props.fields?.Tiktok.value);
    });

    it('should open correct youtube link on click', () => {
        render(<SocialBanner {...props} />);

        const link = screen.getByRole('link', { name: props.fields?.YouTubeAriaLabel.value });

        expect(link).toHaveAttribute('href', props.fields?.YouTube.value);
    });

    it('should open correct X link on click', () => {
        render(<SocialBanner {...props} />);

        const link = screen.getByRole('link', { name: props.fields?.TwitterAriaLabel.value });

        expect(link).toHaveAttribute('href', props.fields?.Twitter.value);
    });

    it('should open correct instagram link on click', () => {
        render(<SocialBanner {...props} />);

        const link = screen.getByRole('link', { name: props.fields?.InstagramAriaLabel.value });

        expect(link).toHaveAttribute('href', props.fields?.Instagram.value);
    });

    it('should NOT render when fields is empty', () => {
        props.fields = undefined;

        const { container } = render(<SocialBanner {...props} />);

        expect(container).toBeEmptyDOMElement();
    });

    describe('Accessibility', () => {
        it('should pass accessibility', async () => {
            const { container } = render(<SocialBanner {...props} />);

            const results = await axe(container);

            expect(results).toHaveNoViolations();
        });
    });
});
