import * as React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { ctaMock } from 'frontend/__mocks__/heroBanners';
import { useMobileViewport } from 'frontend/hooks/useMediaQuery';
import { mockSitecoreField, mockSitecoreImageField } from 'frontend/utils/tests.utils';
import { MediaSize } from 'models/data/MediaSizeParams';

import { CustomersFeedback } from './CustomersFeedback';

jest.mock('frontend/components/common/RichTextWithLinks', () => ({ field }) => <div>{field.value}</div>);

const mockUseInView = { inView: true };
jest.mock('react-intersection-observer', () => ({
    ...jest.requireActual('react-intersection-observer'),
    useInView: jest.fn(() => mockUseInView),
}));

const createStores = () => ({
    appStore: { isScreenLessMedium: false },
    trackingStore: { trackCustomerFeedback: jest.fn() },
});

const createLocalStore = () => ({
    feedbacksStore: {
        isFeefoEnabled: true,
        showReviews: true,
        showTitlesAndComments: true,
        reviewsCount: {
            mobile: 6,
            desktop: 12,
        },
        fetchFeefoReviews: jest.fn(),
        feedbackData: {
            reviews: [
                {
                    rating: 3,
                    title: 'Review Title',
                    text: 'Review Text',
                    date: 'Review Date',
                },
            ],
            averageRating: 0,
            count: 0,
        },
        isError: false,
        maxRatingValue: 5,
    },
});

const createProps = () => ({
    fields: {
        Logo: {},
        Title: mockSitecoreField('Title'),
        SubTitle: mockSitecoreField('SubTitle'),
        Description: mockSitecoreField('Description'),
        Link: ctaMock,
        Disclaimer: mockSitecoreField('Disclaimer'),
        DefaultCustomerName: mockSitecoreField('DefaultCustomerName'),
    },
});

let mockLocalStore = createLocalStore();

let mockStores = createStores();
let props;

jest.mock('./store/createStore', () => ({
    ...jest.requireActual('./store/createStore'),
    useFeedbacksStore: () => mockLocalStore.feedbacksStore,
}));

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

const mockRouterLink = jest.fn();
jest.mock('frontend/components/common/RouterLink', () => ({
    __esModule: true,
    default: ({ onClick, ...props }) => {
        mockRouterLink(props);

        return <button data-tid='router-link' onClick={onClick} />;
    },
}));

jest.mock('frontend/hooks/useMediaQuery');

describe('<CustomersFeedback />', () => {
    beforeEach(() => {
        props = createProps();
        mockLocalStore = createLocalStore();
        mockStores = createStores();
        jest.mocked(useMobileViewport).mockReturnValue(false);
        mockUseInView.inView = true;
    });

    it('should NOT track view event when component is NOT visible', () => {
        mockUseInView.inView = false;

        render(<CustomersFeedback {...props} />);

        expect(mockStores.trackingStore.trackCustomerFeedback).not.toHaveBeenCalled();
    });

    it('should NOT render when no fields', () => {
        props.fields = undefined;

        render(<CustomersFeedback {...props} />);

        expect(screen.queryByText('Title')).not.toBeInTheDocument();
    });

    it('should NOT render when API collapses', async () => {
        mockLocalStore.feedbacksStore.isError = true;

        render(<CustomersFeedback {...props} />);

        await waitFor(() => {
            expect(screen.queryByText('Title')).not.toBeInTheDocument();
        });
    });

    it('should NOT render and fetch reviews when Feefo disabled', () => {
        mockLocalStore.feedbacksStore.isFeefoEnabled = false;

        render(<CustomersFeedback {...props} />);

        expect(mockLocalStore.feedbacksStore.fetchFeefoReviews).not.toHaveBeenCalled();
        expect(screen.queryByText('Title')).not.toBeInTheDocument();
    });

    it('should NOT render carousel when the showReviews option is false', async () => {
        mockLocalStore.feedbacksStore.showReviews = false;

        render(<CustomersFeedback {...props} />);

        await waitFor(() => {
            mockLocalStore.feedbacksStore.feedbackData.reviews.forEach(review => {
                expect(screen.queryByText(review.title)).not.toBeInTheDocument();
            });
        });
    });

    it('should render logo with JSS image on desktop', () => {
        props.fields.Logo = mockSitecoreField(mockSitecoreImageField('Logo'));

        render(<CustomersFeedback {...props} />);

        expect(mockJSSNextImageProps).toHaveBeenCalledWith({
            field: props.fields.Logo,
            className: 'logo',
            'data-tid': 'customers-feedback-logo',
            width: 125,
            height: 29,
            mediaSize: MediaSize.Small,
        });
        expect(mockStores.trackingStore.trackCustomerFeedback).toHaveBeenCalledWith('Title');
    });

    it('should render logo with JSS image on mobile', () => {
        jest.mocked(useMobileViewport).mockReturnValueOnce(true);
        props.fields.Logo = mockSitecoreField(mockSitecoreImageField('Logo'));

        render(<CustomersFeedback {...props} />);

        expect(screen.getByTestId('jss-next-image')).toBeInTheDocument();
        expect(mockJSSNextImageProps).toHaveBeenCalledWith({
            field: props.fields.Logo,
            className: 'logo',
            'data-tid': 'customers-feedback-logo',
            width: 95,
            height: 22,
            mediaSize: MediaSize.Small,
        });
    });

    it('should handle router link click', async () => {
        render(<CustomersFeedback {...props} />);

        const button = screen.getByTestId('router-link');

        await userEvent.click(button);

        expect(mockStores.trackingStore.trackCustomerFeedback).toHaveBeenCalledWith('Title', ctaMock);
    });
});
