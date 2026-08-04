import * as React from 'react';
import { render, screen } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';

import { createMockStores } from 'frontend/__mocks__';
import * as useMedia from 'frontend/hooks/useMediaQuery';
import { PlaceholderNames } from 'models/enum/PlaceholderNames';

import MasonryWrapper, { TMasonryWrapperProps } from './MasonryWrapper';

expect.extend(toHaveNoViolations);

const createProps = (): TMasonryWrapperProps => ({
    fields: {},
    rendering: {},
    params: {
        ReverseView: '1',
    },
    wasRerendered: true,
});

const mockPlaceholderComponent = jest.fn();

let props;
let mockStores;

jest.mock('@sitecore-jss/sitecore-jss-nextjs', () => ({
    __esModule: true,
    ...jest.requireActual('@sitecore-jss/sitecore-jss-nextjs'),
    Placeholder: props => {
        mockPlaceholderComponent(props);

        return <div data-tid='placeholder' />;
    },
}));

jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useContext: () => mockStores,
}));

describe('<HotelSummary />', () => {
    beforeEach(() => {
        props = createProps();
        mockStores = createMockStores();
        jest.spyOn(useMedia, 'useMobileViewport').mockReturnValue(false);
    });

    it('should render placeholders inside wrappers', () => {
        render(<MasonryWrapper {...props} />);

        expect(screen.getByTestId('masonry-aside-wrapper')).toBeInTheDocument();
        expect(screen.getByTestId('masonry-section-wrapper')).toBeInTheDocument();
        expect(mockPlaceholderComponent).toHaveBeenNthCalledWith(1, {
            name: PlaceholderNames.MasonryAside,
            rendering: {},
        });
        expect(mockPlaceholderComponent).toHaveBeenNthCalledWith(2, {
            name: PlaceholderNames.MasonrySection,
            rendering: {},
        });
    });

    it('should not render aside and section wrappers when the component was not rerendered', () => {
        props.wasRerendered = false;

        render(<MasonryWrapper {...props} />);

        expect(screen.queryByTestId('masonry-aside-wrapper')).not.toBeInTheDocument();
        expect(screen.queryByTestId('masonry-section-wrapper')).not.toBeInTheDocument();
    });

    it('should set reverse class for wrapper when it is true in Sitecore params', () => {
        props.params.ReverseView = '1';

        render(<MasonryWrapper {...props} />);

        expect(screen.getByTestId('masonry-wrapper')).toHaveClass('reverseView');
    });

    it('should render placeholders without aside and section wrappers on small screens', () => {
        jest.spyOn(useMedia, 'useMobileViewport').mockReturnValue(true);

        render(<MasonryWrapper {...props} />);

        expect(screen.queryByTestId('masonry-aside-wrapper')).not.toBeInTheDocument();
        expect(screen.queryByTestId('masonry-section-wrapper')).not.toBeInTheDocument();
        expect(mockPlaceholderComponent).toHaveBeenNthCalledWith(1, {
            name: PlaceholderNames.MasonrySection,
            rendering: {},
        });
        expect(mockPlaceholderComponent).toHaveBeenNthCalledWith(2, {
            name: PlaceholderNames.MasonryAside,
            rendering: {},
        });
    });

    describe('Accessibility', () => {
        it('should pass accessibility', async () => {
            const { container } = render(<MasonryWrapper {...props} />);

            const results = await axe(container);

            expect(results).toHaveNoViolations();
        });
    });
});
