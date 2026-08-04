import { render, screen } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';

import { PlaceholderNames } from 'models/enum/PlaceholderNames';

import MasonryWrapperItem, { TMasonryWrapperItemProps } from './MasonryWrapperItem';

expect.extend(toHaveNoViolations);

const createProps = (): TMasonryWrapperItemProps => ({
    fields: null,
    rendering: {},
    params: {
        ItemOrderOnMobile: '3',
    },
});

const mockPlaceholderComponent = jest.fn();

let props;

jest.mock('@sitecore-jss/sitecore-jss-nextjs', () => ({
    __esModule: true,
    ...jest.requireActual('@sitecore-jss/sitecore-jss-nextjs'),
    Placeholder: props => {
        mockPlaceholderComponent(props);

        return <div data-tid='placeholder' />;
    },
}));

let mockUseMobileViewport = true;
jest.mock('frontend/hooks/useMediaQuery', () => ({
    __esModule: true,
    useMobileViewport: () => mockUseMobileViewport,
}));

describe('<MasonryWrapperItem />', () => {
    beforeEach(() => {
        props = createProps();
    });

    it('should render placeholder with sitecore order param when it is mobile', () => {
        render(<MasonryWrapperItem {...props} />);

        expect(screen.getByTestId('masonry-item-wrapper')).toHaveAttribute(
            'style',
            `order: ${props.params.ItemOrderOnMobile};`,
        );
        expect(mockPlaceholderComponent).toHaveBeenCalledWith({ name: PlaceholderNames.MasonryItem, rendering: {} });
    });

    it('should set order 1 in styles for wrapper when ItemOrderOnMobile is not defined', () => {
        props.params.ItemOrderOnMobile = undefined;

        render(<MasonryWrapperItem {...props} />);

        expect(screen.getByTestId('masonry-item-wrapper')).toHaveAttribute('style', 'order: 1;');
    });

    it('should set order 1 if not mobile', () => {
        mockUseMobileViewport = false;

        render(<MasonryWrapperItem {...props} />);

        expect(screen.getByTestId('masonry-item-wrapper')).toHaveAttribute('style', 'order: 1;');
    });

    describe('Accessibility', () => {
        it('should pass accessibility', async () => {
            const { container } = render(<MasonryWrapperItem {...props} />);

            const results = await axe(container);

            expect(results).toHaveNoViolations();
        });
    });
});
