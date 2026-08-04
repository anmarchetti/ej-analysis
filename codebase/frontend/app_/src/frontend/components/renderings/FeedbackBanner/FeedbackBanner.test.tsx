import React from 'react';
import { render, screen } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';

import { createMockStores } from 'frontend/__mocks__';
import { mockSitecoreField } from 'frontend/utils/tests.utils';

import FeedbackBanner, { TFeedbackBannerProps } from './FeedbackBanner';

expect.extend(toHaveNoViolations);

const createProps = (): TFeedbackBannerProps => ({
    fields: {
        Title: mockSitecoreField('How was your hotel?'),
        Subtitle: mockSitecoreField('Your feedback means a lot to us.<br/> Leave a review of your hotel.'),
        CTAButtonLabel: mockSitecoreField('Leave a review'),
    },
    rendering: {},
    params: {},
});

let props: TFeedbackBannerProps;
let mockStores;

const mockRichTextWithLinks = jest.fn();
jest.mock('frontend/components/common/RichTextWithLinks', () => ({
    __esModule: true,
    default: props => {
        mockRichTextWithLinks(props);

        return <div data-tid='rich-text-with-links'>{props.field.value}</div>;
    },
}));

const mockText = jest.fn();
jest.mock('@sitecore-jss/sitecore-jss-nextjs', () => ({
    __esModule: true,
    Text: props => {
        mockText(props);

        return <div data-tid='sitecore-jss-text' />;
    },
}));

jest.mock('frontend/components/icons-new/TripAdvisor', () => ({
    __esModule: true,
    default: () => <svg data-tid='icon-tripadvisor' />,
}));

jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useContext: () => mockStores,
}));

describe('<FeedbackBanner />', () => {
    beforeEach(() => {
        props = createProps();
        mockStores = createMockStores({
            hotelReviewsStore: {
                data: {
                    webUrl: 'google.com',
                },
                fetchReviews: jest.fn(),
            },
        });
    });

    it('should render the action card component with correct props', () => {
        render(<FeedbackBanner {...props} />);

        expect(screen.getByTestId('icon-tripadvisor')).toBeInTheDocument();

        expect(screen.getByTestId('sitecore-jss-text')).toBeInTheDocument();
        expect(mockText).toHaveBeenCalledWith({
            field: props.fields?.Title,
            className: 'title',
            tag: 'h3',
            'data-tid': 'feedback-banner-title',
        });

        expect(screen.getByTestId('rich-text-with-links')).toBeInTheDocument();
        expect(mockRichTextWithLinks).toHaveBeenCalledWith({
            field: props.fields?.Subtitle,
            className: 'description',
            dataId: 'feedback-banner-description',
        });

        expect(screen.getByTestId('feedback-banner-leave-review-link')).toHaveTextContent(
            props.fields!.CTAButtonLabel.value,
        );
    });

    it('should have correct tripadvisor link', () => {
        render(<FeedbackBanner {...props} />);

        const link = screen.getByRole('link', { name: props.fields!.CTAButtonLabel.value });

        expect(link).toHaveAttribute('href', mockStores.hotelReviewsStore.data.webUrl);
    });

    it('should have empty link if there is no url', async () => {
        mockStores.hotelReviewsStore.data.webUrl = '';
        render(<FeedbackBanner {...props} />);

        const link = screen.getByRole('link', { name: props.fields!.CTAButtonLabel.value });

        expect(link).toHaveAttribute('href', '#');
    });

    it('should NOT render when fields is empty', () => {
        props.fields = undefined;

        const { container } = render(<FeedbackBanner {...props} />);

        expect(container).toBeEmptyDOMElement();
    });

    it('should NOT render when booking is empty', () => {
        mockStores.viewBookingStore.booking = null;

        const { container } = render(<FeedbackBanner {...props} />);

        expect(container).toBeEmptyDOMElement();
    });

    describe('Accessibility', () => {
        it('should pass accessibility', async () => {
            const { container } = render(<FeedbackBanner {...props} />);

            const results = await axe(container);

            expect(results).toHaveNoViolations();
        });
    });
});
