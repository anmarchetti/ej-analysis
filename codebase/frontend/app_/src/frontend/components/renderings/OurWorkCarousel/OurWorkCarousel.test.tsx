import * as React from 'react';
import { render, screen } from '@testing-library/react';

import { DESKTOP_ITEMS_AMOUNT, TABLET_ITEMS_AMOUNT } from './constants';
import OurWorkCarousel, { TOurWorkCarouselProps } from './OurWorkCarousel';

const createProps = (): TOurWorkCarouselProps => ({
    fields: {
        Cards: [],
    },
    params: {},
    rendering: {},
});

const mockCarouselComponent = jest.fn();
const mockCarouselCardComponent = jest.fn();

let props;

jest.mock('frontend/components/common/CarouselWrapper/CarouselWrapper', () => ({
    __esModule: true,
    default: props => {
        mockCarouselComponent(props);

        return <div data-tid='carousel'>{props.children}</div>;
    },
}));

jest.mock('./components/OurWorkCarouselCard/OurWorkCarouselCard', () => {
    const { forwardRef } = jest.requireActual('react');

    return {
        __esModule: true,
        default: forwardRef((props, ref) => {
            mockCarouselCardComponent(props);

            return <div data-tid='carousel-card' ref={ref} />;
        }),
    };
});

jest.mock('frontend/components/common/SliderNavButton', () => ({
    __esModule: true,
    default: () => <div data-tid='slider-nav-btn' />,
}));

describe('<OurWorkCarousel />', () => {
    beforeEach(() => {
        props = createProps();
    });

    it('should render the correct number of carousel cards', () => {
        const mockCardFields = { fields: {} };

        props.fields.Cards = new Array(4).fill(mockCardFields);

        render(<OurWorkCarousel {...props} />);

        expect(mockCarouselComponent).toBeCalledWith(
            expect.objectContaining({
                responsive: expect.objectContaining({
                    desktop: expect.objectContaining({ items: DESKTOP_ITEMS_AMOUNT }),
                    tablet: expect.objectContaining({ items: TABLET_ITEMS_AMOUNT }),
                }),
            }),
        );

        expect(mockCarouselCardComponent).toBeCalledTimes(8);
        expect(mockCarouselCardComponent).toBeCalledWith(
            expect.objectContaining({
                titleHeight: 0,
                fields: {},
            }),
        );

        expect(screen.getAllByTestId('carousel-card')).toHaveLength(props.fields.Cards.length);
    });

    it('should render the correct number of carousel cards when there are fewer cards than in the carousel items to show setting', () => {
        const mockCardFields = { fields: {} };

        props.fields.Cards = new Array(2).fill(mockCardFields);

        render(<OurWorkCarousel {...props} />);

        expect(mockCarouselComponent).toBeCalledWith(
            expect.objectContaining({
                responsive: expect.objectContaining({
                    desktop: expect.objectContaining({ items: props.fields.Cards.length }),
                    tablet: expect.objectContaining({ items: props.fields.Cards.length }),
                }),
            }),
        );
    });

    it('should NOT render a card when it has no fields', () => {
        props.fields.Cards = [{ fields: {} }, {}];

        render(<OurWorkCarousel {...props} />);

        expect(screen.getAllByTestId('carousel-card')).toHaveLength(1);
    });

    it('should NOT render the carousel without cards', () => {
        const { container } = render(<OurWorkCarousel {...props} />);

        expect(container).toBeEmptyDOMElement();
    });

    it('should NOT render the carousel without sitecore fields', () => {
        props.fields = undefined;

        const { container } = render(<OurWorkCarousel {...props} />);

        expect(container).toBeEmptyDOMElement();
    });
});
