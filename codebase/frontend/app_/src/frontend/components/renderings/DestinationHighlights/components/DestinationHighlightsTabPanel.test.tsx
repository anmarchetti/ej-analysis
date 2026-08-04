import React from 'react';
import { render, screen } from '@testing-library/react';

import DestinationHighlightsTabPanel from './DestinationHighlightsTabPanel';

const createProps = () => ({
    isActiveTab: true,
    tabItem: {
        id: 'id',
        fields: {
            Title: { value: 'title' },
            Icon: { value: { src: 'image' } },
            Highlights: {
                id: 'id2',
                fields: {
                    Title: { value: 'title2' },
                    Description: { value: 'description' },
                    Image: { value: { src: 'image2' } },
                },
            },
        },
    },
});

jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useRef: () => ({ current: { goToSlide: mockGoToSlide, state: { deviceType: 'test-device' } } }),
}));

let mockProps;
const mockGoToSlide = jest.fn();
const mockDestinationHighlightsCarouselComponent = jest.fn();

jest.mock(
    'frontend/components/renderings/DestinationHighlights/components/DestinationHighlightsCarousel',
    () =>
        ({ isSwipeable, isFullWidth, ssrDeviceType, items }) => {
            mockDestinationHighlightsCarouselComponent(isSwipeable, isFullWidth, ssrDeviceType, items);

            return <div data-tid='carousel' />;
        },
);

describe('<DestinationHighlightsTabPanel />', () => {
    beforeEach(() => {
        mockProps = createProps();
    });

    it('should standard render', () => {
        render(<DestinationHighlightsTabPanel {...mockProps} />);

        expect(screen.getByTestId('carousel')).toBeInTheDocument();
        expect(screen.getByTestId('destination-highlights-tab-panel')).not.toHaveClass('d-none');
        expect(mockGoToSlide).toHaveBeenCalled();
        expect(mockDestinationHighlightsCarouselComponent).toHaveBeenCalledWith(
            false,
            true,
            'test-device',
            mockProps.tabItem.fields.Highlights,
        );
    });

    it('should render destination-highlights-tab-panel with d-none class when is NOT ActiveTab', () => {
        mockProps.isActiveTab = false;
        render(<DestinationHighlightsTabPanel {...mockProps} />);

        expect(screen.getByTestId('destination-highlights-tab-panel')).toHaveClass('d-none');
    });

    it('should render carousel without items when highlights are NOT provided', () => {
        mockProps.tabItem.fields = undefined;
        render(<DestinationHighlightsTabPanel {...mockProps} />);

        expect(screen.getByTestId('carousel')).toBeInTheDocument();
        expect(mockDestinationHighlightsCarouselComponent).toHaveBeenCalledWith(false, true, 'test-device', []);
    });
});
