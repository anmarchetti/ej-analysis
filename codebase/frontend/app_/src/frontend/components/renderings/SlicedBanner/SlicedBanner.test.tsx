import * as React from 'react';
import { render, screen } from '@testing-library/react';

import { mockSitecoreField, mockSitecoreImageField } from 'frontend/utils/tests.utils';

import SlicedBanner, { Direction, TSlicedBannerProps } from './SlicedBanner';

const createProps = (): TSlicedBannerProps => ({
    fields: {
        Title: mockSitecoreField('Title'),
        Subtitle: mockSitecoreField('Subtitle'),
        Image: mockSitecoreField(mockSitecoreImageField('image', 'imageDescription')),
    },
    params: {
        SliceDirection: Direction.Left,
        Anchor: '',
    },
    rendering: {},
});

const mockSlicedBannerImageComponent = jest.fn();
let props;

jest.mock('frontend/components/common/SlicedBannerImage/SlicedBannerImage', () => ({
    __esModule: true,
    default: props => {
        mockSlicedBannerImageComponent(props);

        return <div data-tid='sliced-image' />;
    },
}));

describe('<SlicedBanner />', () => {
    beforeEach(() => {
        props = createProps();
    });

    it('should standard render', () => {
        render(<SlicedBanner {...props} />);

        expect(screen.getByRole('heading', { level: 2 })).toHaveTextContent('Title');
        expect(screen.getByTestId('sliced-banner-subtitle')).toHaveTextContent('Subtitle');
        expect(screen.getByTestId('sliced-image')).toBeInTheDocument();
        expect(mockSlicedBannerImageComponent).toBeCalledWith(
            expect.objectContaining({
                image: {
                    value: {
                        alt: 'imageDescription',
                        src: 'image',
                    },
                },
                isSliceDirectionRight: false,
            }),
        );
    });

    it('should render plane for right slice when it is set in sitecore parameters', () => {
        props.params.SliceDirection = Direction.Right;

        render(<SlicedBanner {...props} />);

        expect(mockSlicedBannerImageComponent).toBeCalledWith(
            expect.objectContaining({
                isSliceDirectionRight: true,
            }),
        );
    });

    it('should not render image when it is undefined in sitecore', () => {
        props.fields.Image = undefined;

        render(<SlicedBanner {...props} />);

        expect(mockSlicedBannerImageComponent).not.toBeCalled();
    });

    it('should not render without sitecore fields', () => {
        props.fields = undefined;

        const { container } = render(<SlicedBanner {...props} />);

        expect(container).toBeEmptyDOMElement();
    });
});
