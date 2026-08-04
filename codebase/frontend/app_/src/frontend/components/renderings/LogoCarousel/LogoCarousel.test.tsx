import * as React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { useMobileViewport } from 'frontend/hooks/useMediaQuery';
import { mockSitecoreField, mockSitecoreImageField } from 'frontend/utils/tests.utils';
import { ISitecoreCompositeField } from 'models/sitecore/generic/ISitecoreField';

import { DESKTOP_ITEMS_AMOUNT, TABLET_ITEMS_AMOUNT } from './constants';
import LogoCarousel, { ILogoCarouselCardFields, TLogoCarouselProps } from './LogoCarousel';

const createProps = (): TLogoCarouselProps => ({
    fields: {
        Cards: [],
        ReadMore: mockSitecoreField('read more'),
        ReadLess: mockSitecoreField('read less'),
    },
    params: {},
    rendering: {},
});

const createCarouselSlideMock = (
    id: string,
    title: string,
    description: string,
    image: string,
): ISitecoreCompositeField<ILogoCarouselCardFields> => ({
    id,
    fields: {
        Title: mockSitecoreField(title),
        Description: mockSitecoreField(description),
        Logo: mockSitecoreField(mockSitecoreImageField(image)),
    },
});

const generateCarouselSlidesMocksArray = (length: number): ISitecoreCompositeField<ILogoCarouselCardFields>[] => {
    const res: ISitecoreCompositeField<ILogoCarouselCardFields>[] = [];

    for (let i = 0; i < length; i++) {
        const cardMock = createCarouselSlideMock(`${i}`, `Title ${i}`, `Description ${i}`, `image${i}.jpg`);
        res.push(cardMock);
    }

    return res;
};

const mockLogoCarouselContentCard = jest.fn();
const mockLogoCarouselImage = jest.fn();
const mockSliderNavButton = jest.fn();

const mockUseMobileViewport = useMobileViewport as jest.MockedFn<typeof useMobileViewport>;

let props;

let mockCurrentSlideSlideIdx = 0;
let mockNextSlideIdx = 3;

jest.mock('frontend/hooks/useMediaQuery');

const mockCarouselComponent = jest.fn();
jest.mock('frontend/components/common/CarouselWrapper/CarouselWrapper', () => {
    const { forwardRef } = jest.requireActual('react');

    return {
        __esModule: true,
        default: forwardRef((props, ref) => {
            ref.current = {
                containerRef: {
                    current: {
                        querySelector: jest.fn(selector => {
                            const index = selector.match(/\d+/)[0];

                            return {
                                querySelector: jest.fn(() => ({
                                    getAttribute: jest.fn(attr => (attr === 'data-slide-index' ? index : null)),
                                })),
                            };
                        }),
                    },
                },
            };

            mockCarouselComponent(props);

            return (
                <div data-tid='react-multi-carousel'>
                    {props.children.map((child, i) => (
                        <div key={i} data-index={`${i}`}>
                            {child}
                        </div>
                    ))}
                    <button
                        onClick={() => props.beforeChange(mockNextSlideIdx, { currentSlide: mockCurrentSlideSlideIdx })}
                    >
                        beforeChange
                    </button>
                    <button onClick={() => props.afterChange(ref, { currentSlide: mockNextSlideIdx })}>
                        afterChange
                    </button>
                    {props.customButtonGroup}
                </div>
            );
        }),
    };
});

jest.mock('frontend/components/common/SliderNavButton', () => ({
    __esModule: true,
    default: props => {
        mockSliderNavButton(props);

        return <div data-tid='slider-nav-btn' />;
    },
}));

jest.mock('./components/LogoCarouselContentCard/LogoCarouselContentCard', () => ({
    __esModule: true,
    default: props => {
        mockLogoCarouselContentCard(props);

        return <div data-tid='logo-carousel-content-card' />;
    },
}));

jest.mock('./components/LogoCarouselImage/LogoCarouselImage', () => ({
    __esModule: true,
    default: props => {
        mockLogoCarouselImage(props);

        return (
            <div data-tid='logo-carousel-image-wrapper' data-slide-index={`${props.dataSlideIndex}`}>
                {props.isActive && 'active-slide'}
            </div>
        );
    },
}));

describe('<LogoCarousel />', () => {
    beforeEach(() => {
        props = createProps();
        mockUseMobileViewport.mockReturnValue(false);
    });

    it('should render the correct number of carousel cards', () => {
        const cardsAmount = 6;
        props.fields.Cards = generateCarouselSlidesMocksArray(cardsAmount);

        render(<LogoCarousel {...props} />);

        expect(mockSliderNavButton).toHaveBeenNthCalledWith(1, expect.objectContaining({ isLeftNav: true }));

        expect(mockCarouselComponent).toHaveBeenCalledWith(
            expect.objectContaining({
                responsive: expect.objectContaining({
                    desktop: expect.objectContaining({ items: DESKTOP_ITEMS_AMOUNT }),
                    tablet: expect.objectContaining({ items: TABLET_ITEMS_AMOUNT }),
                }),
            }),
        );

        expect(mockLogoCarouselImage).toHaveBeenNthCalledWith(
            1,
            expect.objectContaining({
                image: props.fields.Cards[0].fields.Logo,
                isActive: true,
            }),
        );

        expect(screen.getAllByTestId('logo-carousel-image-wrapper')).toHaveLength(cardsAmount);
        expect(screen.getAllByTestId('logo-carousel-content-card')).toHaveLength(cardsAmount);
    });

    it('should set the mobile mode', () => {
        mockUseMobileViewport.mockReturnValue(true);
        const cardsAmount = 5;
        props.fields.Cards = generateCarouselSlidesMocksArray(cardsAmount);

        render(<LogoCarousel {...props} />);

        expect(mockLogoCarouselImage).toHaveBeenNthCalledWith(
            cardsAmount,
            expect.objectContaining({
                image: props.fields.Cards[cardsAmount - 1].fields.Logo,
            }),
        );
        expect(screen.getAllByTestId('logo-carousel-image-wrapper')).toHaveLength(cardsAmount);
        expect(screen.getAllByTestId('logo-carousel-content-card')).toHaveLength(cardsAmount);
    });

    it('carousel should use correct values from getResponsiveConfig function', () => {
        const cardsAmount = 2;
        props.fields.Cards = generateCarouselSlidesMocksArray(cardsAmount);

        render(<LogoCarousel {...props} />);

        expect(mockCarouselComponent).toHaveBeenCalledWith(
            expect.objectContaining({
                responsive: expect.objectContaining({
                    desktop: expect.objectContaining({ items: cardsAmount }),
                    tablet: expect.objectContaining({ items: cardsAmount }),
                }),
            }),
        );
    });

    it('should NOT render the carousel without sitecore fields', () => {
        props.fields = undefined;

        const { container } = render(<LogoCarousel {...props} />);

        expect(container).toBeEmptyDOMElement();
    });

    it('should NOT render the carousel when cards have no fields', () => {
        const { container } = render(<LogoCarousel {...props} />);

        expect(container).toBeEmptyDOMElement();
    });

    describe('check beforeChange callback', () => {
        beforeEach(() => {
            props.fields.Cards = generateCarouselSlidesMocksArray(5);
        });

        it('should NOT set the active state for slides in large screen mode when the carousel starts moving', async () => {
            render(<LogoCarousel {...props} />);

            expect(screen.getAllByText('active-slide')).toHaveLength(1);

            await userEvent.click(screen.getByRole('button', { name: 'beforeChange' }));

            expect(screen.queryAllByText('active-slide')).toHaveLength(0);
        });

        it('should NOT remove the active state for slide when was selected the same slide', async () => {
            mockCurrentSlideSlideIdx = 0;
            mockNextSlideIdx = 0;

            render(<LogoCarousel {...props} />);

            expect(screen.getAllByText('active-slide')).toHaveLength(1);

            await userEvent.click(screen.getByRole('button', { name: 'beforeChange' }));

            expect(screen.getAllByText('active-slide')).toHaveLength(1);
        });
    });

    describe('check afterChange callback', () => {
        beforeEach(() => {
            props.fields.Cards = generateCarouselSlidesMocksArray(5);
            mockCurrentSlideSlideIdx = 0;
        });

        it('should set the active state for the new slide and show the corresponding article in large screen mode when the carousel finishes moving', async () => {
            mockNextSlideIdx = 3;

            render(<LogoCarousel {...props} />);

            await userEvent.click(screen.getByRole('button', { name: 'afterChange' }));

            const images = screen.getAllByTestId('logo-carousel-image-wrapper');

            expect(images.length).toBe(5);
            expect(images[mockNextSlideIdx]).toHaveTextContent('active-slide');
            expect(screen.getAllByTestId('logo-carousel-image-wrapper')).toHaveLength(props.fields.Cards.length);

            expect(mockLogoCarouselContentCard).toHaveBeenNthCalledWith(1, {
                description: { value: 'Description 0' },
                title: { value: 'Title 0' },
                isExpandable: true,
                readMoreButtonText: props.fields.ReadMore,
                readLessButtonText: props.fields.ReadLess,
                activeIdx: 0,
                isActive: true,
            });

            // mockNextSlideIdx = 3 matches the 4th call of LogoCarouselContentCard during the second render of LogoCarousel
            expect(mockLogoCarouselContentCard).toHaveBeenCalledWith({
                description: { value: 'Description 3' },
                title: { value: 'Title 3' },
                isExpandable: true,
                readMoreButtonText: props.fields.ReadMore,
                readLessButtonText: props.fields.ReadLess,
                activeIdx: 3,
                isActive: true,
            });
        });

        it('should not switch article when selected the same slide and the carousel finishes moving', async () => {
            mockNextSlideIdx = 0;
            const expected = {
                description: { value: 'Description 0' },
                title: { value: 'Title 0' },
                isExpandable: true,
                readMoreButtonText: props.fields.ReadMore,
                readLessButtonText: props.fields.ReadLess,
                activeIdx: 0,
                isActive: true,
            };

            render(<LogoCarousel {...props} />);

            await userEvent.click(screen.getByRole('button', { name: 'afterChange' }));

            expect(mockLogoCarouselContentCard).toHaveBeenNthCalledWith(1, expected);
        });
    });
});
