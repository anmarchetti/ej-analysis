import React from 'react';
import { render } from '@testing-library/react';

import { PlaceholderNames } from 'models/enum/PlaceholderNames';
import { ISitecoreComponent } from 'models/sitecore/generic/ISitecoreComponent';

import PageFooterColumn from './PageFooterColumn';

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

describe('<PageFooterColumn />', () => {
    beforeEach(() => {
        mockProps = createProps();
    });

    it('should render standard', () => {
        mockProps.rendering = { placeholders: { [PlaceholderNames.FooterColumnInner]: ['test'] } };

        const { container } = render(<PageFooterColumn {...mockProps} />);

        expect(container.firstChild).toHaveClass('col-auto');
        expect(mockPlaceholderProps).toHaveBeenCalledWith({
            name: PlaceholderNames.FooterColumnInner,
            rendering: mockProps.rendering,
        });
    });
});
