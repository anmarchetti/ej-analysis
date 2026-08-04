import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import * as mediaQueryUtils from 'frontend/hooks/useMediaQuery';
import { IDesktopMapPOIContentProps } from 'frontend/components/renderings/MapPointsOfInterest/IMapPointsOfInterest';

import { desktopContentProps } from './__mocks__';
import DesktopPOIContent, { CAROUSEL_RESPONSIVE } from './DesktopPOIContent';

const createProps = (): IDesktopMapPOIContentProps => desktopContentProps;

let mockProps;
const mockGoToSlide = jest.fn();
jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useRef: jest.fn(() => ({
        current: { goToSlide: mockGoToSlide },
    })),
}));

jest.mock('frontend/components/common/ButtonSwitch/ButtonSwitch.tsx', () => ({
    __esModule: true,
    default: ({ onClick, children }) => (
        <button data-tid='button-switch' onClick={() => onClick(1)}>
            {children}
        </button>
    ),
}));

const mockCarouselWrapper = jest.fn();
jest.mock('frontend/components/common/CarouselWrapper/CarouselWrapper.tsx', () => ({
    __esModule: true,
    default: ({ customButtonGroup, children, ...props }) => {
        mockCarouselWrapper(props);

        return (
            <div data-tid='carousel'>
                {customButtonGroup}
                {children}
            </div>
        );
    },
}));

jest.mock('frontend/components/common/CarouselButtonsGroup/CarouselButtonsGroup.tsx', () => ({
    __esModule: true,
    default: () => <div data-tid='carousel-buttons-group' />,
}));

jest.mock('frontend/components/renderings/MapPointsOfInterest/components/SinglePointCard', () => ({
    __esModule: true,
    default: () => <div data-tid='single-point-card' />,
}));

jest.mock('frontend/components/common/TextWithTooltip/TextWithTooltip.tsx', () => ({
    __esModule: true,
    default: () => <div data-tid='text-with-tooltip' />,
}));

const mockUseTabletViewport = jest.spyOn(mediaQueryUtils, 'useTabletViewport');

describe('<DesktopPOIContent />', () => {
    beforeEach(() => {
        mockProps = createProps();
        mockUseTabletViewport.mockReturnValue(false);
    });

    it('should render desktop items', () => {
        render(<DesktopPOIContent {...mockProps} />);

        expect(screen.getByTestId('button-switch')).toBeInTheDocument();
        expect(screen.getByTestId('carousel')).toBeInTheDocument();
        expect(screen.getByTestId('text-with-tooltip')).toBeInTheDocument();
        expect(screen.getAllByTestId('single-point-card').length).toBe(4);
        expect(screen.getByTestId('carousel-buttons-group')).toBeInTheDocument();
        expect(mockCarouselWrapper).toHaveBeenCalledWith({
            responsive: CAROUSEL_RESPONSIVE,
            partialVisible: false,
            infinite: false,
            arrows: false,
            showDots: false,
            containerClass: 'carouselContainer',
            dotListClass: 'carouselDotList',
        });
    });

    it('should render tablet items', () => {
        mockUseTabletViewport.mockReturnValue(true);

        render(<DesktopPOIContent {...mockProps} />);

        expect(screen.getByTestId('button-switch')).toBeInTheDocument();
        expect(screen.getByTestId('carousel')).toBeInTheDocument();
        expect(screen.getByTestId('text-with-tooltip')).toBeInTheDocument();
        expect(screen.getAllByTestId('single-point-card').length).toBe(4);
        expect(screen.getByTestId('carousel-buttons-group')).toBeInTheDocument();
        expect(mockCarouselWrapper).toHaveBeenCalledWith({
            responsive: CAROUSEL_RESPONSIVE,
            partialVisible: true,
            infinite: false,
            arrows: false,
            showDots: true,
            containerClass: 'carouselContainer',
            dotListClass: 'carouselDotList',
        });
    });

    it('should call handleCategoryClick onClick and goToSlide on activeIndex change', async () => {
        const { rerender } = render(<DesktopPOIContent {...mockProps} />);

        await userEvent.click(screen.getByTestId('button-switch'));

        expect(mockProps.handleCategoryClick).toHaveBeenCalledWith('category2-key');

        rerender(<DesktopPOIContent {...mockProps} />);

        expect(mockGoToSlide).toHaveBeenCalledWith(0);
    });

    it('should NOT render SinglePointCard when activeCategoryItems are empty', () => {
        mockProps.categoriesWithItems = [];

        render(<DesktopPOIContent {...mockProps} />);

        expect(screen.queryByTestId('single-point-card')).not.toBeInTheDocument();
    });
});
