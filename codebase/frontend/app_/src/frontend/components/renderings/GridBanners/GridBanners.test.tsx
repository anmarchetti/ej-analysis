import * as React from 'react';
import { render, screen } from '@testing-library/react';

import GridBanners, { TGridBannersProps } from './GridBanners';

const createProps = (): TGridBannersProps => ({
    fields: {
        Children: [],
    },
    params: {},
    rendering: {},
});

const mockBannerCardComponent = jest.fn();
let props;

jest.mock('frontend/components/common/BannerCard/BannerCard', () => ({
    __esModule: true,
    default: props => {
        mockBannerCardComponent(props);

        return <div data-tid='banner-card' />;
    },
}));

describe('<GridBanners />', () => {
    beforeEach(() => {
        props = createProps();
    });

    it('should render the correct number of banner cards', () => {
        props.fields.Children = new Array(5).fill({ fields: {} });

        const childrenCount = props.fields.Children.length;

        render(<GridBanners {...props} />);

        expect(mockBannerCardComponent).toBeCalledTimes(childrenCount);
        expect(mockBannerCardComponent).toBeCalledWith(
            expect.objectContaining({
                childrenCount,
                isGridBanner: true,
                isSingleGridItemOnRow: false,
            }),
        );

        expect(mockBannerCardComponent).toHaveBeenNthCalledWith(
            5,
            expect.objectContaining({
                isSingleGridItemOnRow: true,
            }),
        );

        expect(screen.getAllByTestId('banner-card')).toHaveLength(childrenCount);
    });

    it('should render custom class name when it is set in sitecore parameters', () => {
        props.fields.Children = [{ fields: {} }];
        props.params.ClassName = 'test';

        render(<GridBanners {...props} />);

        expect(screen.getByTestId('grid-banners-container')).toHaveClass('test');
    });

    it('should NOT render children when it has no fields', () => {
        props.fields.Children = [{ fields: {} }, {}];

        render(<GridBanners {...props} />);

        expect(screen.getAllByTestId('banner-card')).toHaveLength(1);
    });

    it('should NOT render without children elements', () => {
        const { container } = render(<GridBanners {...props} />);

        expect(container).toBeEmptyDOMElement();
    });

    it('should NOT render without sitecore fields', () => {
        props.fields = undefined;

        const { container } = render(<GridBanners {...props} />);

        expect(container).toBeEmptyDOMElement();
    });
});
