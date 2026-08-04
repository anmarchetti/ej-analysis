import React from 'react';
import { render, screen } from '@testing-library/react';

import * as useMediaQueryModule from 'frontend/hooks/useMediaQuery';
import { mockSitecoreField } from 'frontend/utils/tests.utils';
import { IPromoBlockFields } from 'models/data/IPromoBlockFields';
import { IconTextCarouselIconAlignment } from 'models/enum/PromoBlocksIconTextCarouselVariantParams';

import IconTextCarousel, { IIconTextCarouselProps } from './IconTextCarousel';

const mockIconTextCarouselItemProps = jest.fn();
jest.mock('./components/IconTextCarouselItem', () => ({
    __esModule: true,
    default: props => {
        mockIconTextCarouselItemProps(props);

        return <div data-tid={`carousel-item-${props.item.id}`}>{props.item.fields.Title.value}</div>;
    },
}));

const mockCarouselWrapperProps = jest.fn();
jest.mock('frontend/components/common/CarouselWrapper/CarouselWrapper', () => ({
    __esModule: true,
    default: ({ children, ...props }) => {
        mockCarouselWrapperProps(props);

        return <div data-tid='carousel-wrapper'>{children}</div>;
    },
}));

jest.mock('frontend/hooks/useMediaQuery', () => ({
    useMobileViewport: jest.fn(() => false),
    useTabletViewport: jest.fn(() => false),
}));

jest.mock('frontend/utils/sitecore.utils', () => ({
    isSitecoreCheckboxSelected: jest.fn(value => value === '1'),
}));

jest.mock('frontend/components/renderings/PromoBlocks/PromoBlocks.utils', () => ({
    getPromoBlocksResponsiveByTheme: jest.fn(() => ({
        mobile: { items: 1 },
        tablet: { items: 3 },
        desktop: { items: 4 },
    })),
    getItemsCountByDevice: jest.fn(() => 4),
}));

const mockPromoBlockFieldsByIndex = (index: number): IPromoBlockFields =>
    ({
        fields: { Title: mockSitecoreField(`Item-${index}`) },
        id: `${index}`,
    } as IPromoBlockFields);

const createProps = (): IIconTextCarouselProps => ({
    items: [
        mockPromoBlockFieldsByIndex(1),
        mockPromoBlockFieldsByIndex(2),
        mockPromoBlockFieldsByIndex(3),
        mockPromoBlockFieldsByIndex(4),
        mockPromoBlockFieldsByIndex(5),
    ],
    params: {
        AddBackgroundShadow: '1',
        IconAlignment: IconTextCarouselIconAlignment.Center,
    },
    titleClassName: 'titleClassName',
});

let mockProps: IIconTextCarouselProps;

describe('<IconTextCarousel />', () => {
    beforeEach(() => {
        mockProps = createProps();
    });

    describe('Rendering', () => {
        it('should render the correct number of carousel items', () => {
            render(<IconTextCarousel {...mockProps} />);

            const items = screen.getAllByTestId(/^carousel-item-/);
            expect(items).toHaveLength(mockProps.items.length);

            expect(mockIconTextCarouselItemProps).toHaveBeenCalledTimes(mockProps.items.length);

            mockProps.items.forEach((item, index) => {
                expect(mockIconTextCarouselItemProps).toHaveBeenNthCalledWith(index + 1, {
                    item,
                    alignment: mockProps.params.IconAlignment,
                    hasShadow: true,
                    titleClassName: mockProps.titleClassName,
                });
            });
        });

        it('should render nothing if items array is empty', () => {
            mockProps.items = [];

            render(<IconTextCarousel {...mockProps} />);

            expect(screen.queryAllByTestId(/^carousel-item-/)).toHaveLength(0);
        });
    });

    describe('CarouselWrapper configuration', () => {
        it('should render CarouselWrapper with correct props for desktop with items > 4', () => {
            render(<IconTextCarousel {...mockProps} />);

            expect(screen.getByTestId('carousel-wrapper')).toBeInTheDocument();
            expect(mockCarouselWrapperProps).toHaveBeenCalledWith(
                expect.objectContaining({
                    centerMode: false,
                    partialVisible: false,
                    arrows: false,
                    showDots: true,
                    infinite: true,
                    renderButtonGroupOutside: true,
                }),
            );
        });

        it('should render CarouselWrapper with correct props for tablet with items > 3', () => {
            jest.spyOn(useMediaQueryModule, 'useTabletViewport').mockReturnValueOnce(true);

            render(<IconTextCarousel {...mockProps} />);

            expect(screen.getByTestId('carousel-wrapper')).toBeInTheDocument();
            expect(mockCarouselWrapperProps).toHaveBeenCalledWith(
                expect.objectContaining({
                    showDots: true,
                    arrows: false,
                    infinite: true,
                    partialVisible: false,
                    renderButtonGroupOutside: true,
                }),
            );
        });

        it('should render CarouselWrapper with correct props for mobile with items > 1', () => {
            jest.spyOn(useMediaQueryModule, 'useMobileViewport').mockReturnValueOnce(true);

            render(<IconTextCarousel {...mockProps} />);

            expect(screen.getByTestId('carousel-wrapper')).toBeInTheDocument();
            expect(mockCarouselWrapperProps).toHaveBeenCalledWith(
                expect.objectContaining({
                    showDots: true,
                    arrows: false,
                    infinite: true,
                    partialVisible: true,
                }),
            );
        });

        it('should not show carousel on desktop when items <= 4', () => {
            mockProps.items = [mockProps.items[0], mockProps.items[1], mockProps.items[2]];

            render(<IconTextCarousel {...mockProps} />);

            expect(screen.getByTestId('carousel-wrapper')).toBeInTheDocument();
            expect(mockCarouselWrapperProps).toHaveBeenCalledWith(
                expect.objectContaining({
                    showDots: false,
                    arrows: false,
                    infinite: false,
                }),
            );
        });

        it('should not show carousel on tablet when items <= 3', () => {
            jest.spyOn(useMediaQueryModule, 'useTabletViewport').mockReturnValueOnce(true);
            mockProps.items = [mockProps.items[0], mockProps.items[1]];

            render(<IconTextCarousel {...mockProps} />);

            expect(screen.getByTestId('carousel-wrapper')).toBeInTheDocument();
            expect(mockCarouselWrapperProps).toHaveBeenCalledWith(
                expect.objectContaining({
                    showDots: false,
                    infinite: false,
                }),
            );
        });

        it('should not show carousel on mobile when items <= 1', () => {
            jest.spyOn(useMediaQueryModule, 'useMobileViewport').mockReturnValueOnce(true);
            mockProps.items = [mockProps.items[0]];

            render(<IconTextCarousel {...mockProps} />);

            expect(screen.getByTestId('carousel-wrapper')).toBeInTheDocument();
            expect(mockCarouselWrapperProps).toHaveBeenCalledWith(
                expect.objectContaining({
                    showDots: false,
                    infinite: false,
                }),
            );
        });
    });

    describe('Shadow handling', () => {
        it('should pass hasShadow as true when AddBackgroundShadow is "on"', () => {
            mockProps.params.AddBackgroundShadow = '1';

            render(<IconTextCarousel {...mockProps} />);

            expect(mockIconTextCarouselItemProps).toHaveBeenCalled();
            expect(mockIconTextCarouselItemProps.mock.calls[0][0].hasShadow).toBe(true);
        });

        it('should pass hasShadow as false when AddBackgroundShadow is not selected', () => {
            mockProps.params.AddBackgroundShadow = undefined;

            render(<IconTextCarousel {...mockProps} />);

            expect(mockIconTextCarouselItemProps).toHaveBeenCalled();
            expect(mockIconTextCarouselItemProps.mock.calls[0][0].hasShadow).toBe(false);
        });
    });

    describe('Props passing', () => {
        it('should pass correct alignment to each item', () => {
            mockProps.params.IconAlignment = IconTextCarouselIconAlignment.Left;

            render(<IconTextCarousel {...mockProps} />);

            mockIconTextCarouselItemProps.mock.calls.forEach(call => {
                expect(call[0].alignment).toBe(IconTextCarouselIconAlignment.Left);
            });
        });

        it('should pass correct titleClassName to each item', () => {
            render(<IconTextCarousel {...mockProps} />);

            mockIconTextCarouselItemProps.mock.calls.forEach(call => {
                expect(call[0].titleClassName).toBe(mockProps.titleClassName);
            });
        });
    });
});
