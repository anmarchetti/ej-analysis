import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';

import { createMockStores } from 'frontend/__mocks__';
import { mockSitecoreField, mockSitecoreImageField } from 'frontend/utils/tests.utils';
import SitecoreDictionary from 'models/enum/SitecoreDictionary';
import { EventTypes } from 'models/enum/tracking/EventTypes';
import { getMockedExcursion } from 'frontend/components/renderings/Excursions/__mocks__/excursion';

import ExcursionItem, { IExcursionItemProps } from './ExcursionItem';

const createProps = (): IExcursionItemProps => ({
    item: getMockedExcursion(),
    fields: {
        LikelyToSellOut: mockSitecoreField('LikelyToSellOut'),
        FreeCancellation: mockSitecoreField('FreeCancellation'),
        Description: mockSitecoreField('Description'),
        Logo: mockSitecoreField(mockSitecoreImageField('image')),
        PoweredBy: mockSitecoreField('PoweredBy'),
        SeeMoreDesktop: mockSitecoreField('SeeMoreDesktop'),
        SeeMoreMobile: mockSitecoreField('SeeMoreMobile'),
        Title: mockSitecoreField('Title'),
    },
    params: {
        isPrimaryCTA: false,
        isLeftAligned: false,
    },
    index: 1,
    descriptionMaxLines: 5,
    trackExcursion: jest.fn(),
});

let props;
let mockStores;

jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useContext: () => mockStores,
}));

const mockUseInView = { inView: true };
jest.mock('react-intersection-observer', () => ({
    ...jest.requireActual('react-intersection-observer'),
    useInView: jest.fn(() => mockUseInView),
}));

describe('<ExcursionItem />', () => {
    beforeEach(() => {
        props = createProps();
        mockStores = createMockStores();
    });

    it('Should render excursion block content', () => {
        const { getByTestId } = render(<ExcursionItem {...props} />);

        const image = screen.getByTestId('excursion-image');
        expect(image).toBeInTheDocument();
        expect(image).toHaveAttribute('src', props.item.coverImageUrl);
        expect(image).toHaveAttribute('alt', props.item.title);
        expect(image).toHaveAttribute('loading', 'lazy');

        expect(getByTestId('excursion-item-title')).toHaveTextContent(props.item.title);
        expect(getByTestId('excursion-item-review-text')).toHaveTextContent(
            `${props.item.reviewsNumber} ${SitecoreDictionary.HotelReviewsLabelsReviewItemPlural}`,
        );
        expect(getByTestId('excursion-item-description')).toHaveTextContent(props.item.description);
        expect(getByTestId('excursion-item-free-cancellation')).toBeInTheDocument();
        expect(getByTestId('excursion-item-price-block')).toHaveTextContent(`£${props.item.retailPrice.value}`);
    });

    it('Should render excursion block with singular description when item reviewsNumber is equal to 1', () => {
        props.item.reviewsNumber = 1;
        const { getByTestId } = render(<ExcursionItem {...props} />);

        expect(getByTestId('excursion-item-review-text')).toHaveTextContent(
            `1 ${SitecoreDictionary.HotelReviewsLabelsReviewItemSingular}`,
        );
    });

    it('No review text should be displayed if there is no number of reviews', () => {
        props.item.reviewsNumber = 0;
        const { queryByTestId } = render(<ExcursionItem {...props} />);

        expect(queryByTestId('excursion-item-review-text')).not.toBeInTheDocument();
    });

    it('If the item has likelyToSellOut option, the badge should be rendered in the card', () => {
        props.item.likelyToSellOut = true;
        props.fields.LikelyToSellOut.value = 'test';
        const { getByTestId } = render(<ExcursionItem {...props} />);

        expect(getByTestId('excursion-item-badge')).toHaveTextContent(props.fields.LikelyToSellOut.value);
    });

    it('If excursion has a free cancel option, the card will display the relevant label', () => {
        props.fields.FreeCancellation.value = 'test';
        const { getByTestId } = render(<ExcursionItem {...props} />);

        expect(getByTestId('excursion-item-free-cancellation')).toHaveTextContent(props.fields.FreeCancellation.value);
    });

    it('Link exists and has the correct attributes', () => {
        const { getByTestId } = render(<ExcursionItem {...props} />);
        const link = getByTestId('excursion-item-link');

        expect(link).toHaveTextContent(SitecoreDictionary.GlobalsButtonsBookNow);
        expect(link).toHaveAttribute('href', props.item.url);
        expect(link).toHaveAttribute('target', '_blank');
    });

    it('Link should have outlined className if isPrimaryCTA is false', () => {
        render(<ExcursionItem {...props} />);
        const link = screen.getByRole('link', { name: SitecoreDictionary.GlobalsButtonsBookNow });

        expect(link).toHaveClass('btn--outlined');
    });

    it('Link should NOT have outlined className depending on isPrimaryCTA', () => {
        props.params.isPrimaryCTA = true;
        render(<ExcursionItem {...props} />);
        const link = screen.getByRole('link', { name: SitecoreDictionary.GlobalsButtonsBookNow });

        expect(link).not.toHaveClass('btn--outlined');
    });

    describe('onClick', () => {
        it('Should push to datatalayer on clicking on the link', () => {
            const { getByTestId } = render(<ExcursionItem {...props} />);
            const link = getByTestId('excursion-item-link');

            fireEvent.click(link);

            expect(mockStores.trackingStore.trackEventWithParams).toHaveBeenCalledWith(
                EventTypes.ExcursionClick,
                {
                    name: SitecoreDictionary.GlobalsButtonsBookNow,
                    destination: props.item.url,
                    position: props.index + 1,
                    section: props.item.title,
                    price: props.item.retailPrice.value,
                    MoreInfoDisplayed: 'No',
                    FreeCancellationDisplayed: 'Yes',
                },
                undefined,
                true,
            );
        });

        it('Should push to datatalayer with additional OverlayMessage parameter on clicking on the link when item likelyToSellOut prop is true', () => {
            props.item.likelyToSellOut = true;
            const { getByTestId } = render(<ExcursionItem {...props} />);
            const link = getByTestId('excursion-item-link');

            fireEvent.click(link);

            expect(mockStores.trackingStore.trackEventWithParams).toHaveBeenCalledWith(
                EventTypes.ExcursionClick,
                {
                    name: SitecoreDictionary.GlobalsButtonsBookNow,
                    destination: props.item.url,
                    position: props.index + 1,
                    section: props.item.title,
                    price: props.item.retailPrice.value,
                    MoreInfoDisplayed: 'No',
                    FreeCancellationDisplayed: 'Yes',
                    OverlayMessage: props.fields.LikelyToSellOut.value,
                },
                undefined,
                true,
            );
        });
    });

    it('Should push to datatalayer when component is visible', async () => {
        render(<ExcursionItem {...props} />);

        await waitFor(() => {
            expect(props.trackExcursion).toHaveBeenCalledTimes(1);
        });
    });
});
