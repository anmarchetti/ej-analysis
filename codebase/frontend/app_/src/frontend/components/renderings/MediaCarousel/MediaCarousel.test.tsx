import * as React from 'react';
import { render } from '@testing-library/react';

import { IMediaCarouselProps, MediaCarousel } from './MediaCarousel';

describe('MediaCarousel', () => {
    const createMockProps = () =>
        ({
            isScreenLessMedium: false,
            fields: {
                items: [
                    {
                        fields: {
                            Image: {
                                value: {
                                    src: 'test',
                                },
                            },
                        },
                    },
                ],
            },
        } as IMediaCarouselProps);

    let mockProps = createMockProps();

    beforeEach(() => {
        mockProps = createMockProps();
    });

    it('should NOT render carousel if no items', () => {
        mockProps.fields = {};
        const { container } = render(<MediaCarousel {...mockProps} />);

        expect(container.querySelector('.media-carousel')).toBeEmptyDOMElement();
    });

    it('should render Carousel with two items', () => {
        mockProps.fields = {
            items: [
                {
                    fields: {
                        Image: {
                            value: {
                                src: 'test 1',
                            },
                        },
                    },
                },
                {
                    fields: {
                        Image: {
                            value: {
                                src: 'test 2',
                            },
                        },
                    },
                },
            ],
        };

        const { container } = render(<MediaCarousel {...mockProps} />);

        expect(container.querySelectorAll('.media-carousel__item')).toHaveLength(2);
    });

    it('should render Carousel with one item without bullets', () => {
        const { container } = render(<MediaCarousel {...mockProps} />);

        expect(container.querySelectorAll('.media-carousel__item')).toHaveLength(1);
        expect(container.querySelector('.image-gallery-bullets')).toBeNull();
    });
});
