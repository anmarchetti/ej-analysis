import * as React from 'react';
import { render, screen } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';

import { createMockStores } from 'frontend/__mocks__';
import { mockSitecoreField, mockSitecoreLinkField } from 'frontend/utils/tests.utils';
import SitecoreLinkType from 'models/enum/SitecoreLinkType';
import SitePath from 'models/enum/SitePath';

import { BreadcrumbsStatic, TBreadcrumbsStaticProps } from './BreadcrumbsStatic';

expect.extend(toHaveNoViolations);

jest.mock('frontend/components/common/Link', () => ({ children, href }) => (
    <a data-tid='link' href={href}>
        {children}
    </a>
));

jest.mock('frontend/components/common/RouterLink', () => ({ children, link }) => (
    <a data-tid='router-link' href={link.value.href}>
        {children}
    </a>
));

const createProps = (): TBreadcrumbsStaticProps => ({
    params: {
        IsHomeIconShown: undefined,
        IsOpaque: undefined,
        IsWrapped: undefined,
        IsShadowed: undefined,
    },
    rendering: {},
    fields: {
        items: [
            {
                id: '1',
                fields: {
                    Text: mockSitecoreField('text'),
                    Link: mockSitecoreField(mockSitecoreLinkField('href', '', SitecoreLinkType.Internal)),
                },
            },
            {
                id: '2',
                fields: {
                    Text: mockSitecoreField('text2'),
                    Link: mockSitecoreField(mockSitecoreLinkField('href2', '', SitecoreLinkType.Internal)),
                },
            },
        ],
    },
});

let mockProps;
let mockStores;

jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useContext: () => mockStores,
}));

describe('BreadcrumbsStatic', () => {
    beforeEach(() => {
        mockProps = createProps();
        mockStores = createMockStores({
            queryParamStore: {
                buildRedirectUrlQuery: jest.fn(),
            },
        });
    });

    it('should be empty render if no breadcrumbs from fields', () => {
        mockProps.fields.items = null;
        const { container } = render(<BreadcrumbsStatic {...mockProps} />);
        expect(container).toBeEmptyDOMElement();
    });

    it('should render breadcrumbs by props value', () => {
        render(<BreadcrumbsStatic {...mockProps} />);

        expect(screen.getByTestId('router-link')).toHaveTextContent(mockProps.fields.items[0].fields.Text.value);
        expect(screen.getByTestId('breadcrumb-current-page')).toHaveTextContent(
            mockProps.fields.items[1].fields.Text.value,
        );
        expect(screen.getByTestId('breadcrumbs-static')).not.toHaveClass('pathBreadcrumbsWrap');
        expect(screen.getByTestId('breadcrumbs-static-ul')).not.toHaveClass('breadcrumbsOpaque');
    });

    it('should render breadcrumbs with correct link', () => {
        render(<BreadcrumbsStatic {...mockProps} />);

        expect(screen.getByTestId('router-link')).toHaveAttribute(
            'href',
            mockProps.fields.items[0].fields.Link.value.href,
        );
        expect(screen.queryByTestId('link')).not.toBeInTheDocument();
        expect(screen.getAllByTestId('chevron-right')).toHaveLength(1);
    });

    it('should render last breadcrumbs without link', () => {
        render(<BreadcrumbsStatic {...mockProps} />);

        expect(screen.getByTestId('router-link')).toHaveAttribute(
            'href',
            mockProps.fields.items[0].fields.Link.value.href,
        );
        expect(screen.getAllByTestId('router-link')).toHaveLength(1);
        expect(screen.getByTestId('breadcrumb-current-page')).toHaveTextContent(
            mockProps.fields.items[1].fields.Text.value,
        );
    });

    it('should apply correct classes', () => {
        mockProps.params.IsHomeIconShown = '1';
        mockProps.params.IsWrapped = '1';
        mockProps.params.IsOpaque = '1';
        mockProps.params.IsShadowed = '1';
        render(<BreadcrumbsStatic {...mockProps} />);
        expect(screen.getByTestId('breadcrumbs-static')).toHaveClass('pathBreadcrumbsWrap');
        expect(screen.getByTestId('breadcrumbs-static-ul')).toHaveClass('breadcrumbs', 'breadcrumbsOpaque', 'shadowed');
    });

    it('should show home icon when isHomeIconShown', () => {
        mockProps.params.IsHomeIconShown = '1';
        render(<BreadcrumbsStatic {...mockProps} />);
        expect(screen.getByTestId('link')).toHaveAttribute('href', SitePath.Home);
        expect(screen.getAllByTestId('chevron-right')).toHaveLength(2);
    });

    describe('Accessibility', () => {
        it('should pass accessibility', async () => {
            const { container } = render(<BreadcrumbsStatic {...mockProps} />);
            const results = await axe(container);

            expect(results).toHaveNoViolations();
        });

        it('should render ariaLabel', () => {
            render(<BreadcrumbsStatic {...mockProps} />);

            expect(screen.getByTestId('breadcrumbs-static')).toHaveAttribute('aria-label', 'Breadcrumbs');
        });
    });
});
