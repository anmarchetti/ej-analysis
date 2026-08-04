import * as React from 'react';
import { fireEvent, render, screen, within } from '@testing-library/react';

import { mockSitecoreField, mockSitecoreLinkField } from 'frontend/utils/tests.utils';
import INavLink from 'models/data/INavLink';
import SitecoreLinkType from 'models/enum/SitecoreLinkType';
import { EventTypes } from 'models/enum/tracking/EventTypes';

import { FooterDropdown, TFooterDropdownProps } from './FooterDropdown';

const mockBuildSitecoreLinkFullUrl: string = 'mockBuildSitecoreLinkFullUrl';
jest.mock('frontend/utils/url.utils', () => ({
    buildSitecoreLinkFullUrl: jest.fn(() => mockBuildSitecoreLinkFullUrl),
}));

jest.mock('frontend/components/icons/ChevronDown.tsx', () => ({
    __esModule: true,
    default: () => <svg data-tid='icon-chevron-down' />,
}));

jest.mock('frontend/components/icons/ChevronUp', () => ({
    __esModule: true,
    default: () => <svg data-tid='icon-chevron-up' />,
}));

const mockRouterLinkProps = jest.fn();
const mockRouterLinkClickIndex: number = 0;
const mockRouterLinkClickItem: INavLink = {
    id: '1',
    fields: { Link: { value: { href: 'link-1', text: 'link-1', linktype: SitecoreLinkType.External } } },
};
jest.mock('frontend/components/common/RouterLink', () => ({
    __esModule: true,
    default: ({ children, onClick, ...props }) => {
        mockRouterLinkProps(props);

        return (
            <div data-tid='router-link' onClick={() => onClick(mockRouterLinkClickIndex, mockRouterLinkClickItem)}>
                {children}
            </div>
        );
    },
}));

jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useContext: () => mockStores,
}));

const resetMocks = (): TFooterDropdownProps => ({
    fields: {
        Link: { value: { ...mockSitecoreLinkField('/link-1', 'link-1'), url: 'Group Title' } },
        ChildrenLinks: [
            { id: '1', fields: { Link: mockSitecoreField(mockSitecoreLinkField('/link-1', 'link-1')) } },
            { id: '2', fields: { Link: mockSitecoreField(mockSitecoreLinkField('/link-2', 'link-2')) } },
        ],
    },
    id: 'id',
    wasRerendered: true,
});

const createStores = () => ({
    layoutStore: {
        sitePath: 'sitePath',
    },
    appStore: {
        isScreenLarge: true,
    },
    trackingStore: {
        trackHomepageAction: jest.fn(),
    },
});

let mockProps;
let mockStores;

describe('<FooterDropdown />', () => {
    beforeEach(() => {
        mockProps = resetMocks();
        mockStores = createStores();
    });

    it('should not render', () => {
        mockProps.fields = null;
        const { container } = render(<FooterDropdown {...mockProps} />);

        expect(container).toBeEmptyDOMElement();
    });

    it('should render title and list on large screens', () => {
        const { container } = render(<FooterDropdown {...mockProps} />);
        const wrapper = container.querySelector('.footer__list-item');
        const title = wrapper!.querySelector('.footer__list-title');
        const linkList = screen.getByTestId('navigation-links');
        const linkListElements = linkList.querySelectorAll('.navigation__link');
        const childrenLinksLength = mockProps.fields.ChildrenLinks.length;
        const routerLinkElements = screen.getAllByTestId('router-link');
        const firstLinkFieldsMock = mockProps.fields.ChildrenLinks[0].fields.Link;
        const secondLinkFieldsMock = mockProps.fields.ChildrenLinks[1].fields.Link;

        expect(title).toHaveTextContent(mockProps.fields.Link.value.url);
        expect(linkList).toBeInTheDocument();
        expect(linkListElements).toHaveLength(childrenLinksLength);
        expect(routerLinkElements).toHaveLength(childrenLinksLength);
        expect(routerLinkElements[0]).toHaveTextContent(firstLinkFieldsMock.value.text);
        expect(routerLinkElements[1]).toHaveTextContent(secondLinkFieldsMock.value.text);
        expect(mockRouterLinkProps).toHaveBeenNthCalledWith(1, {
            link: firstLinkFieldsMock,
        });
        expect(mockRouterLinkProps).toHaveBeenNthCalledWith(2, {
            link: secondLinkFieldsMock,
        });
        expect(screen.queryByRole('button')).not.toBeInTheDocument();
    });

    it('should render title and list on small screens when wasRerendered is falsy', () => {
        mockStores.appStore.isScreenLarge = false;
        mockProps.wasRerendered = false;
        const { container } = render(<FooterDropdown {...mockProps} />);
        const wrapper = container.querySelector('.footer__list-item');
        const title = wrapper!.querySelector('.footer__list-title');
        const linkList = screen.getByTestId('navigation-links');
        const linkListElements = linkList.querySelectorAll('.navigation__link');
        const childrenLinksLength = mockProps.fields.ChildrenLinks.length;
        const routerLinkElements = screen.getAllByTestId('router-link');
        const firstLinkFieldsMock = mockProps.fields.ChildrenLinks[0].fields.Link;
        const secondLinkFieldsMock = mockProps.fields.ChildrenLinks[1].fields.Link;

        expect(title).toHaveTextContent(mockProps.fields.Link.value.url);
        expect(linkList).toBeInTheDocument();
        expect(linkListElements).toHaveLength(childrenLinksLength);
        expect(routerLinkElements).toHaveLength(childrenLinksLength);
        expect(routerLinkElements[0]).toHaveTextContent(firstLinkFieldsMock.value.text);
        expect(routerLinkElements[1]).toHaveTextContent(secondLinkFieldsMock.value.text);
        expect(mockRouterLinkProps).toHaveBeenNthCalledWith(1, {
            link: firstLinkFieldsMock,
        });
        expect(mockRouterLinkProps).toHaveBeenNthCalledWith(2, {
            link: secondLinkFieldsMock,
        });
        expect(screen.queryByRole('button')).not.toBeInTheDocument();
    });

    it('should not render navigation-links block when ChildrenLinks array is undefined', () => {
        mockProps.fields.ChildrenLinks = undefined;
        render(<FooterDropdown {...mockProps} />);

        expect(screen.queryByTestId('navigation-links')).not.toBeInTheDocument();
    });

    it('should render collapsed dropdown on small screens', () => {
        mockStores.appStore.isScreenLarge = false;
        const { container } = render(<FooterDropdown {...mockProps} />);
        const wrapper = container.querySelector('.footer__list-item');
        const title = wrapper!.querySelector('.footer__list-title');
        const titleButton = screen.getByRole('button');

        expect(title).toBeInTheDocument();
        expect(titleButton).toHaveTextContent(mockProps.fields.Link.value.url);
        expect(titleButton).toHaveAttribute('aria-expanded', 'false');
        expect(titleButton).toHaveClass('btn btn--txt');
        expect(within(titleButton).getByTestId('icon-chevron-down')).toBeInTheDocument();
        expect(screen.queryByTestId('navigation-links')).not.toBeInTheDocument();
    });

    it('should open dropdown and display nav links on button click on small screens', () => {
        mockStores.appStore.isScreenLarge = false;
        render(<FooterDropdown {...mockProps} />);
        const titleButton = screen.getByRole('button', { name: mockProps.fields.Link.value.url });

        expect(screen.queryByTestId('navigation-links')).not.toBeInTheDocument();
        expect(titleButton).toHaveAttribute('aria-expanded', 'false');
        expect(within(titleButton).getByTestId('icon-chevron-down')).toBeInTheDocument();

        fireEvent.click(titleButton);

        expect(titleButton).toHaveAttribute('aria-expanded', 'true');
        expect(screen.getByTestId('navigation-links')).toBeInTheDocument();
        expect(within(titleButton).getByTestId('icon-chevron-up')).toBeInTheDocument();
    });

    it('should track RouterLink click with expected params', () => {
        render(<FooterDropdown {...mockProps} />);

        fireEvent.click(screen.getAllByTestId('router-link')[0]);

        expect(mockStores.trackingStore.trackHomepageAction).toHaveBeenCalledWith(EventTypes.FooterClick, {
            location: 'Footer',
            position: `${mockRouterLinkClickIndex + 1}`,
            name: mockRouterLinkClickItem.fields.Link.value.text,
            destination: mockBuildSitecoreLinkFullUrl,
            section: mockProps.fields.Link.value.url,
        });
    });
});
