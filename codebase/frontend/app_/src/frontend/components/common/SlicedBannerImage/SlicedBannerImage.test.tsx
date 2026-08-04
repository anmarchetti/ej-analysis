import * as React from 'react';
import { render, screen } from '@testing-library/react';

import { mockSitecoreField, mockSitecoreImageField } from 'frontend/utils/tests.utils';

import SlicedBannerImage, { ISlicedBannerImageProps } from './SlicedBannerImage';

const createProps = (): ISlicedBannerImageProps => ({
    image: mockSitecoreField(mockSitecoreImageField('image', 'imageDescription')),
    isSliceDirectionRight: false,
});

const mockJSSResponsiveImageComponent = jest.fn();
let props;

jest.mock('frontend/components/common/JSSResponsiveImage', () => ({
    __esModule: true,
    default: props => {
        mockJSSResponsiveImageComponent(props);

        return <div data-tid='image' />;
    },
}));

describe('<SlicedBannerImage />', () => {
    beforeEach(() => {
        props = createProps();
    });

    it('should standard render', () => {
        render(<SlicedBannerImage {...props} />);
        expect(screen.getByTestId('sliced-banner-image-cut-left')).toBeInTheDocument();
        expect(mockJSSResponsiveImageComponent).toBeCalledWith(
            expect.objectContaining({
                role: 'presentation',
                field: {
                    value: {
                        alt: 'imageDescription',
                        src: 'image',
                    },
                },
            }),
        );
    });

    it('should not render image when it is undefined', () => {
        props.image = undefined;

        render(<SlicedBannerImage {...props} />);

        expect(mockJSSResponsiveImageComponent).not.toBeCalled();
    });

    it('should render plane for right slice when isSliceDirectionRight prop is true', () => {
        props.isSliceDirectionRight = true;
        render(<SlicedBannerImage {...props} />);

        expect(screen.getByTestId('sliced-banner-image-cut-right')).toBeInTheDocument();
    });
});
