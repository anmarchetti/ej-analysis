import React from 'react';
import { render, screen } from '@testing-library/react';

import { createMockStores } from 'frontend/__mocks__';
import SitecoreDictionary from 'models/enum/SitecoreDictionary';

import DestinationHighlightsCarousel from './DestinationHighlightsCarousel';

const createProps = () => ({
    items: [{ id: '1' }, { id: '2' }, { id: '3' }, { id: '4' }, { id: '5' }, { id: '6' }],
    isFullWidth: true,
    isSwipeable: true,
    responsive: {},
    ssrDeviceType: 'key',
});

let mockProps;
let mockStores = createMockStores();

jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useContext: () => mockStores,
}));

jest.mock('frontend/components/renderings/DestinationHighlights/components/DestinationHighlightsCard', () => () => (
    <div data-tid='destination-highlights-card' />
));

jest.mock('frontend/components/common/CarouselWrapper/CarouselWrapper', () => {
    const { forwardRef } = jest.requireActual('react');

    return {
        __esModule: true,
        default: forwardRef(({ children, customLeftArrow, customRightArrow }: any, ref: any) => (
            <div data-tid='carousel' ref={ref}>
                {customLeftArrow}
                <div>{children}</div>
                {customRightArrow}
            </div>
        )),
    };
});

describe('<DestinationHighlightsCarousel />', () => {
    beforeEach(() => {
        mockProps = createProps();
        mockStores = createMockStores();
    });

    it('should render carousel', () => {
        const { getByTestId } = render(<DestinationHighlightsCarousel {...mockProps} />);

        expect(getByTestId('carousel')).toBeInTheDocument();
    });

    it('should render 6 DestinationHighlightsCards', () => {
        const { getAllByTestId } = render(<DestinationHighlightsCarousel {...mockProps} />);

        expect(getAllByTestId('destination-highlights-card').length).toBe(6);
    });

    it('should NOT render DestinationHighlightsCard when no item provided', () => {
        mockProps.items = [];
        const { queryByTestId } = render(<DestinationHighlightsCarousel {...mockProps} />);

        expect(queryByTestId('destination-highlights-card')).not.toBeInTheDocument();
    });

    describe('Accessibility', () => {
        it('should render aria-label', () => {
            render(<DestinationHighlightsCarousel {...mockProps} />);

            expect(screen.getByTestId('slide-button-prev')).toHaveAttribute(
                'aria-label',
                SitecoreDictionary.AccessibilityAriaLabelsPreviousButton,
            );
            expect(screen.getByTestId('slide-button-next')).toHaveAttribute(
                'aria-label',
                SitecoreDictionary.AccessibilityAriaLabelsNextButton,
            );
        });
    });
});
