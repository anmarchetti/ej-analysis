import React from 'react';
import { render } from '@testing-library/react';

import { PlaceholderNames } from 'models/enum/PlaceholderNames';
import { ISitecoreComponent } from 'models/sitecore/generic/ISitecoreComponent';

import PageFooterSlim from './PageFooterSlim';

const mockPlaceholderProps = jest.fn();
jest.mock('@sitecore-jss/sitecore-jss-nextjs', () => ({
    __esModule: true,
    ...jest.requireActual('@sitecore-jss/sitecore-jss-nextjs'),
    Placeholder: props => {
        mockPlaceholderProps(props);

        return <div data-tid='placeholder' />;
    },
}));

const createProps = (): ISitecoreComponent => ({
    fields: {},
    params: {},
    rendering: {},
});

let mockProps;

describe('<PageFooterSlim />', () => {
    beforeEach(() => {
        mockProps = createProps();
    });

    it('should render standard', () => {
        mockProps.rendering = { placeholders: { [PlaceholderNames.FooterRow]: ['test'] } };
        const { container } = render(<PageFooterSlim {...mockProps} />);

        const triangle = container.querySelector('.wrapper--solid.wrapper-triangle--w2o');
        const footer = container.querySelector('.footer-slim.footer--orange');
        const footerWrapper = footer!.querySelector('.wrapper-container.wrapper-container--px');
        const placeholder = footerWrapper!.querySelector('[data-tid="placeholder"]');

        expect(triangle).toBeInTheDocument();
        expect(placeholder).toBeInTheDocument();
        expect(mockPlaceholderProps).toHaveBeenCalledWith({
            name: PlaceholderNames.FooterRow,
            rendering: mockProps.rendering,
        });
    });
});
