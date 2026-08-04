import * as React from 'react';
import { render } from '@testing-library/react';

import { PlaceholderNames } from 'models/enum/PlaceholderNames';

import PageFooter, { TPageFooterProps } from './PageFooter';

const mockPlaceholderProps = jest.fn();
jest.mock('@sitecore-jss/sitecore-jss-nextjs', () => ({
    __esModule: true,
    Placeholder: props => {
        mockPlaceholderProps(props);

        return <div data-tid='placeholder' />;
    },
}));

describe('<PageFooter />', () => {
    const resetMocks = (): TPageFooterProps => ({
        fields: undefined,
        rendering: { componentName: 'componentName' },
        params: { IsTriangleStart: '', IsGreyBackground: '' },
    });

    let mockProps;

    beforeEach(() => {
        mockProps = resetMocks();
    });

    it('should render standard', () => {
        mockProps.rendering = { placeholders: { [PlaceholderNames.FooterRow]: ['test'] } };
        const { container } = render(<PageFooter {...mockProps} />);
        const footer = container.querySelector('.footer--orange');
        const footerWrapper = footer!.querySelector('.wrapper-container.wrapper-container--px');
        const placeholder = footerWrapper!.querySelector('[data-tid="placeholder"]');

        expect(container.querySelector('.footer--grey')).not.toBeInTheDocument();
        expect(placeholder).toBeInTheDocument();
        expect(mockPlaceholderProps).toHaveBeenCalledWith({
            name: PlaceholderNames.FooterRow,
            rendering: mockProps.rendering,
        });
    });

    describe('triangle', () => {
        it('should render wrapper-triangle--w2o when IsTriangleStart param is passed', () => {
            mockProps.params.IsTriangleStart = '1';
            const { container } = render(<PageFooter {...mockProps} />);
            const triangle = container.querySelector('.wrapper--solid.wrapper-triangle--w2o');

            expect(triangle).toBeInTheDocument();
        });

        it('should not render wrapper-triangle--w2o when IsTriangleStart param is not passed', () => {
            mockProps.params.IsTriangleStart = '';
            const { container } = render(<PageFooter {...mockProps} />);
            const triangle = container.querySelector('.wrapper--solid.wrapper-triangle--w2o');

            expect(triangle).not.toBeInTheDocument();
        });
    });

    it('should be grey footer when IsGreyBackground param is passed', () => {
        mockProps.params.IsGreyBackground = '1';
        const { container } = render(<PageFooter {...mockProps} />);

        expect(container.querySelector('.footer--grey')).toBeInTheDocument();
        expect(container.querySelector('.footer--orange')).not.toBeInTheDocument();
    });
});
