import React from 'react';
import { render, screen } from '@testing-library/react';

import { mockSitecoreField, mockSitecoreLinkField } from 'frontend/utils/tests.utils';

import FooterNavigation, { TFooterNavigationProps } from './FooterNavigation';

const mockRouterLinkProps = jest.fn();
jest.mock('frontend/components/common/RouterLink', () => ({
    __esModule: true,
    default: ({ children, ...props }) => {
        mockRouterLinkProps(props);

        return <div data-tid='router-link'>{children}</div>;
    },
}));

describe('<FooterNavigation />', () => {
    const resetMocks = (): TFooterNavigationProps => ({
        fields: {
            items: [
                { id: '1', fields: { Link: mockSitecoreField(mockSitecoreLinkField('/link-1', 'link-1')) } },
                { id: '2', fields: { Link: mockSitecoreField(mockSitecoreLinkField('/link-2', 'link-2')) } },
            ],
        },
        params: {},
        rendering: {},
    });

    let mockProps;

    beforeEach(() => {
        mockProps = resetMocks();
    });

    it('should not render', () => {
        mockProps.fields = null;
        const { container } = render(<FooterNavigation {...mockProps} />);

        expect(container).toBeEmptyDOMElement();
    });

    it('should render standard', () => {
        render(<FooterNavigation {...mockProps} />);

        expect(screen.getByRole('navigation')).toBeInTheDocument();
        expect(screen.getByTestId('navigation-links')).toBeInTheDocument();

        const listItems = screen.getAllByTestId('router-link');

        expect(listItems).toHaveLength(2);

        const firstItemLinkMock = mockProps.fields.items[0].fields.Link;

        expect(listItems[0]).toHaveTextContent(firstItemLinkMock.value.text);
        expect(mockRouterLinkProps).toHaveBeenNthCalledWith(1, { link: firstItemLinkMock });

        const secondItemLinkMock = mockProps.fields.items[1].fields.Link;

        expect(listItems[1]).toHaveTextContent(secondItemLinkMock.value.text);
        expect(mockRouterLinkProps).toHaveBeenNthCalledWith(2, { link: secondItemLinkMock });
    });

    it('should render li elements in ul tag for items that contain a defined Link value', () => {
        mockProps.fields.items = [
            ...mockProps.fields.items,
            { id: 3, fields: null },
            { id: 4, fields: { Link: null } },
            { id: 5, fields: { Link: { value: '' } } },
        ];

        render(<FooterNavigation {...mockProps} />);

        const listItems = screen.getAllByTestId('router-link');
        const firstItemLinkMock = mockProps.fields.items[0].fields.Link;
        const secondItemLinkMock = mockProps.fields.items[1].fields.Link;

        expect(listItems).toHaveLength(2);
        expect(listItems[0]).toHaveTextContent(firstItemLinkMock.value.text);
        expect(listItems[1]).toHaveTextContent(secondItemLinkMock.value.text);
    });
});
