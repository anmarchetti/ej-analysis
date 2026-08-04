import React from 'react';
import { render, screen } from '@testing-library/react';

import { createMockStores } from 'frontend/__mocks__';
import { mockSitecoreField, mockSitecoreImageField } from 'frontend/utils/tests.utils';
import { getMockedExcursions } from 'frontend/components/renderings/Excursions/__mocks__/excursion';

import ExcursionCarousel, { IExcursionCarouselProps } from './ExcursionCarousel';

let mockHideArrows;
let mockGetShowDots;
jest.mock('frontend/components/renderings/Excursions/Excursions.utils', () => ({
    ...jest.requireActual('frontend/components/renderings/Excursions/Excursions.utils'),
    hideArrows: () => mockHideArrows,
    getShowDots: () => mockGetShowDots,
}));

jest.mock('frontend/hooks/useMediaQuery', () => ({
    __esModule: true,
    useMobileViewport: jest.fn(),
    useMoreThenTabletViewport: jest.fn(),
}));

const mockReactCarousel = jest.fn();
jest.mock('frontend/components/common/CarouselWrapper/CarouselWrapper', () => ({
    __esModule: true,
    default: props => {
        mockReactCarousel(props);

        return (
            <div data-tid='carousel'>
                {props.children} {props.customButtonGroup}
            </div>
        );
    },
}));

const mockExcursionItem = jest.fn();
jest.mock('frontend/components/renderings/Excursions/components/ExcursionItem/ExcursionItem', () => ({
    __esModule: true,
    default: props => {
        mockExcursionItem(props);

        return <div data-tid='excursion-item' />;
    },
}));

jest.mock('frontend/components/common/SliderButtonsGroup', () => ({
    __esModule: true,
    default: () => <div data-tid='slider-buttons-group' />,
}));

const createProps = (): IExcursionCarouselProps => ({
    excursions: getMockedExcursions(5),
    fields: {
        Title: mockSitecoreField('Title'),
        FreeCancellation: mockSitecoreField('FreeCancellation'),
        LikelyToSellOut: mockSitecoreField('LikelyToSellOut'),
        PoweredBy: mockSitecoreField('PoweredBy'),
        SeeMoreMobile: mockSitecoreField('SeeMoreMobile'),
        SeeMoreDesktop: mockSitecoreField('SeeMoreDesktop'),
        Logo: mockSitecoreField(mockSitecoreImageField('Logo')),
        Description: mockSitecoreField('Description'),
    },
    params: { isPrimaryCTA: false, isLeftAligned: false },
    trackExcursion: jest.fn(),
});

let mockProps;
let mockStores;

jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useContext: () => mockStores,
}));

describe('<ExcursionCarousel />', () => {
    beforeEach(() => {
        mockProps = createProps();
        mockStores = createMockStores();
        mockHideArrows = false;
        mockGetShowDots = true;
    });

    it('Should standard render', () => {
        render(<ExcursionCarousel {...mockProps} />);

        expect(screen.getByTestId('carousel')).toBeInTheDocument();
        expect(screen.getByTestId('slider-buttons-group')).toBeInTheDocument();
        expect(screen.getAllByTestId('excursion-item').length).toBe(mockProps.excursions.length);
        expect(mockExcursionItem).toHaveBeenCalledWith(
            expect.objectContaining({
                isHorizontalView: false,
            }),
        );
    });

    it('Should hide arrows when hideArrows returns true', () => {
        mockHideArrows = true;
        render(<ExcursionCarousel {...mockProps} />);

        expect(screen.getByTestId('carousel')).toBeInTheDocument();
        expect(screen.queryByTestId('slider-buttons-group')).not.toBeInTheDocument();
    });

    it('Should hide dots when getShowDots returns false', () => {
        mockGetShowDots = false;
        render(<ExcursionCarousel {...mockProps} />);

        expect(mockReactCarousel).toHaveBeenCalledWith(
            expect.objectContaining({
                showDots: false,
            }),
        );
    });

    it('Should render ExcursionItem with isHorizontalView true if only one item exist', () => {
        mockProps.excursions = getMockedExcursions();

        render(<ExcursionCarousel {...mockProps} />);

        expect(mockExcursionItem).toHaveBeenCalledTimes(1);
        expect(mockExcursionItem).toHaveBeenCalledWith(
            expect.objectContaining({
                isHorizontalView: true,
            }),
        );
    });
});
