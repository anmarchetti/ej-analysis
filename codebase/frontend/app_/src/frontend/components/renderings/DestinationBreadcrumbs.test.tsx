import * as React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { DestinationBreadcrumbs } from './DestinationBreadcrumbs';

jest.mock('frontend/components/common/Link', () => ({ children, href }) => <a href={href}>{children}</a>);
jest.mock('frontend/components/common/Button', () => props => <button {...props} />);

const createStores = () => ({
    layoutStore: {
        pageBreadcrumbs: [
            { key: 'Spain', value: '/destinations/spain' },
            { key: 'Majorca', value: '/destinations/spain/majorca' },
            { key: 'Catalonia Majorca', value: '/destinations/spain/majorca/caralonia-majorca' },
        ],
    },
});

let mockStores = createStores();

jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useContext: () => mockStores,
}));

describe('DestinationBreadcrumbs', () => {
    beforeEach(() => {
        mockStores = createStores();
    });

    it('should be empty render if no breadcrumbs', () => {
        mockStores.layoutStore.pageBreadcrumbs = [];
        const { container } = render(<DestinationBreadcrumbs />);
        expect(container.firstChild).toBeNull();
    });

    it('should render breadcrumbs links with home item by layout value', () => {
        render(<DestinationBreadcrumbs />);

        expect(screen.getByLabelText('Home')).toBeInTheDocument();
        expect(screen.getAllByRole('link', { name: 'Spain' })[0]).toHaveAttribute('href', '/destinations/spain');
        expect(screen.getAllByRole('link', { name: 'Majorca' })[0]).toHaveAttribute(
            'href',
            '/destinations/spain/majorca',
        );
        expect(screen.getByText('Catalonia Majorca')).toBeInTheDocument();
    });

    it('should render breadcrumbs without home item', () => {
        render(<DestinationBreadcrumbs hideHomeBreadcrumb />);

        expect(screen.queryByLabelText('Home')).not.toBeInTheDocument();
    });

    it('should render breadcrumbs by props value', () => {
        render(
            <DestinationBreadcrumbs
                breadcrumbs={[
                    { key: 'Test-1', value: '/test-1' },
                    { key: 'Test-2', value: '/test-1/test-2' },
                ]}
            />,
        );

        expect(screen.getAllByRole('link', { name: 'Test-1' })[0]).toHaveAttribute('href', '/test-1');
        expect(screen.getByText('Test-2')).toBeInTheDocument();
    });

    it('should use correct classes from props', () => {
        render(<DestinationBreadcrumbs className='test' wrapperClassName='test2' />);

        expect(screen.getByTestId('path-breadcrumbs-ul')).toHaveClass('test');
        expect(screen.getByTestId('path-breadcrumbs-wrapper')).toHaveClass('test2');
    });

    it('should render breadcrumbs with opaque style', () => {
        const { container } = render(<DestinationBreadcrumbs isOpaqueStyle />);

        expect(container.querySelector('.path-breadcrumbs--opaque')).toBeInTheDocument();
    });

    it('should call onBreadcrumbClick when home breadcrumb is clicked', async () => {
        const onBreadcrumbClick = jest.fn();
        render(<DestinationBreadcrumbs onBreadcrumbClick={onBreadcrumbClick} />);

        await userEvent.click(screen.getByLabelText('Home'));
        expect(onBreadcrumbClick).toHaveBeenCalled();
    });

    it('should render breadcrumb items as buttons when onBreadcrumbClick is provided', () => {
        const onBreadcrumbClick = jest.fn();
        render(<DestinationBreadcrumbs onBreadcrumbClick={onBreadcrumbClick} />);

        expect(screen.getByRole('button', { name: 'Home' })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'Spain' })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'Majorca' })).toBeInTheDocument();
    });

    it('should render breadcrumb items as links when onBreadcrumbClick is not provided', () => {
        render(<DestinationBreadcrumbs />);

        expect(screen.queryByRole('button', { name: 'Spain' })).not.toBeInTheDocument();
        expect(screen.getByLabelText('Home')).toBeInTheDocument();
    });

    it('should call onBreadcrumbClick when a breadcrumb link is clicked', async () => {
        const onBreadcrumbClick = jest.fn();
        render(<DestinationBreadcrumbs onBreadcrumbClick={onBreadcrumbClick} />);

        await userEvent.click(screen.getByText('Spain'));
        expect(onBreadcrumbClick).toHaveBeenCalled();
    });
});
