import React from 'react';
import { render } from '@testing-library/react';

import { createMockStores } from 'frontend/__mocks__';
import SitecoreDictionary from 'models/enum/SitecoreDictionary';

import TripadvisorInfo from './TripadvisorInfo';

const createProps = () => ({
    rating: 1,
    reviews: 2,
    reviewsAnchor: 'anchor',
});

const createStores = () => createMockStores();

let mockProps;
let mockStores = createStores();

jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useContext: () => mockStores,
}));

jest.mock('frontend/components/common/TripadvisorRating/TripadvisorRating', () => () => (
    <div data-tid='tripadvisor-rating' />
));

describe('<TripadvisorInfo />', () => {
    beforeEach(() => {
        mockProps = createProps();
        mockStores = createStores();

        Object.defineProperty(window, 'scrollY', {
            writable: true,
            value: 0,
        });
        Object.defineProperty(document.documentElement, 'scrollTop', {
            writable: true,
            value: 0,
        });
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    it('should render link when reviews anchor provided', () => {
        const { getByRole } = render(<TripadvisorInfo {...mockProps} />);

        expect(getByRole('link')).toBeInTheDocument();
    });

    it('should NOT render link when reviews anchor NOT provided', () => {
        mockProps.reviewsAnchor = null;
        const { queryByRole } = render(<TripadvisorInfo {...mockProps} />);

        expect(queryByRole('link')).not.toBeInTheDocument();
    });

    it('should render TripadvisorRating', () => {
        const { getByTestId } = render(<TripadvisorInfo {...mockProps} />);

        expect(getByTestId('tripadvisor-rating')).toBeInTheDocument();
    });

    it('should render HotelReviewsLabelsReviewItemPlural when there is more than 1 reviews', () => {
        const { getByText } = render(<TripadvisorInfo {...mockProps} />);

        expect(getByText(`2 ${SitecoreDictionary.HotelReviewsLabelsReviewItemPlural}`)).toBeInTheDocument();
    });

    it('should render HotelReviewsLabelsReviewItemSingular when there is only 1 review', () => {
        mockProps.reviews = 1;
        const { getByText } = render(<TripadvisorInfo {...mockProps} />);

        expect(getByText(`1 ${SitecoreDictionary.HotelReviewsLabelsReviewItemSingular}`)).toBeInTheDocument();
    });

    describe('scroll event handling', () => {
        it('should add scroll event listener when reviewsAnchor is provided', () => {
            const addEventListenerSpy = jest.spyOn(document, 'addEventListener');

            render(<TripadvisorInfo {...mockProps} />);

            expect(addEventListenerSpy).toHaveBeenCalledWith('scroll', expect.any(Function));
        });

        it('should NOT add scroll event listener when reviewsAnchor is not provided', () => {
            mockProps.reviewsAnchor = null;
            const addEventListenerSpy = jest.spyOn(document, 'addEventListener');

            render(<TripadvisorInfo {...mockProps} />);

            expect(addEventListenerSpy).not.toHaveBeenCalledWith('scroll', expect.any(Function));
        });

        it('should remove scroll event listener on component unmount', () => {
            const removeEventListenerSpy = jest.spyOn(document, 'removeEventListener');

            const { unmount } = render(<TripadvisorInfo {...mockProps} />);

            unmount();

            expect(removeEventListenerSpy).toHaveBeenCalledWith('scroll', expect.any(Function));
        });

        it('should NOT remove scroll event listener on unmount when reviewsAnchor was not provided', () => {
            mockProps.reviewsAnchor = null;
            const removeEventListenerSpy = jest.spyOn(document, 'removeEventListener');

            const { unmount } = render(<TripadvisorInfo {...mockProps} />);

            unmount();

            expect(removeEventListenerSpy).not.toHaveBeenCalledWith('scroll', expect.any(Function));
        });
    });

    describe('scrollStickyBoxHeight method', () => {
        let windowScrollToSpy: jest.SpyInstance;
        let addEventListenerSpy: jest.SpyInstance;
        const mockElement = document.createElement('div');
        const mockStickyBox = document.createElement('div');

        beforeEach(() => {
            windowScrollToSpy = jest.spyOn(window, 'scrollTo');
            addEventListenerSpy = jest.spyOn(document, 'addEventListener');

            jest.spyOn(mockElement, 'getBoundingClientRect').mockReturnValue({
                top: 0,
                bottom: 100,
                left: 0,
                right: 100,
                width: 100,
                height: 100,
                x: 0,
                y: 0,
                toJSON: () => ({}),
            });
        });

        it('should adjust scroll position when element top is 0', () => {
            jest.spyOn(document, 'getElementById').mockImplementation(id => {
                if (id === mockProps.reviewsAnchor) {
                    return mockElement;
                }

                if (id === 'sticky-box') {
                    return mockStickyBox;
                }

                return null;
            });

            Object.defineProperty(mockStickyBox, 'offsetHeight', {
                value: 100,
                writable: false,
            });

            (window.scrollY as number) = 500;

            render(<TripadvisorInfo {...mockProps} />);

            const scrollHandler = addEventListenerSpy.mock.calls.find(call => call[0] === 'scroll')?.[1];

            if (scrollHandler) {
                (scrollHandler as EventListener)({} as Event);
            }

            expect(windowScrollToSpy).toHaveBeenCalledWith(0, 400);
        });

        it('should NOT adjust scroll position when element top is not 0', () => {
            jest.spyOn(document, 'getElementById').mockImplementation(id => {
                if (id === mockProps.reviewsAnchor) {
                    return mockElement;
                }

                return null;
            });

            render(<TripadvisorInfo {...mockProps} />);

            const scrollHandler = addEventListenerSpy.mock.calls.find(call => call[0] === 'scroll')?.[1];

            if (scrollHandler) {
                (scrollHandler as EventListener)({} as Event);
            }

            expect(windowScrollToSpy).not.toHaveBeenCalled();
        });

        it('should NOT adjust scroll position when element does not exist', () => {
            jest.spyOn(document, 'getElementById').mockReturnValue(null);

            render(<TripadvisorInfo {...mockProps} />);

            const scrollHandler = addEventListenerSpy.mock.calls.find(call => call[0] === 'scroll')?.[1];

            if (scrollHandler) {
                (scrollHandler as EventListener)({} as Event);
            }

            expect(windowScrollToSpy).not.toHaveBeenCalled();
        });
    });
});
