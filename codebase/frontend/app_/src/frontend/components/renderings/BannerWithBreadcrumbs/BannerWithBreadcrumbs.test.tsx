import React from 'react';
import { render, screen } from '@testing-library/react';

import { mockSitecoreField, mockSitecoreImageField } from 'frontend/utils/tests.utils';

import BannerWithBreadcrumbs, { TBannerWithBreadcrumbsProps } from './BannerWithBreadcrumbs';

const createProps = (): TBannerWithBreadcrumbsProps => ({
    fields: {
        Image: mockSitecoreField(mockSitecoreImageField('image', 'imageDescription')),
        Title: mockSitecoreField('Title'),
    },
    params: {},
    rendering: {},
});

let props;

const mockSlicedBannerImageComponent = jest.fn();

jest.mock('frontend/components/renderings/DestinationBreadcrumbs', () => ({
    __esModule: true,
    default: () => <div data-tid='destination-breadcrumbs' />,
}));

jest.mock('frontend/components/common/SlicedBannerImage/SlicedBannerImage', () => ({
    __esModule: true,
    default: props => {
        mockSlicedBannerImageComponent(props);

        return <div data-tid='sliced-banner-image' />;
    },
}));

describe('<BannerWithBreadcrumbs />', () => {
    beforeEach(() => {
        props = createProps();
    });

    it('should standard render', () => {
        render(<BannerWithBreadcrumbs {...props} />);

        expect(screen.getByTestId('destination-breadcrumbs')).toBeInTheDocument();
        expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Title');
        expect(mockSlicedBannerImageComponent).toBeCalledWith(
            expect.objectContaining({
                image: props.fields.Image,
                isBottomSlice: true,
            }),
        );
    });

    it('should NOT render a title when it is undefined', () => {
        props.fields.Title = undefined;

        render(<BannerWithBreadcrumbs {...props} />);

        expect(screen.queryByRole('heading', { level: 1 })).not.toBeInTheDocument();
    });

    it('should NOT render image when it is undefined', () => {
        props.fields.Image = undefined;

        render(<BannerWithBreadcrumbs {...props} />);

        expect(mockSlicedBannerImageComponent).not.toBeCalled();
    });

    it('should NOT render without sitecore fields', () => {
        props.fields = undefined;

        const { container } = render(<BannerWithBreadcrumbs {...props} />);

        expect(container).toBeEmptyDOMElement();
    });
});
