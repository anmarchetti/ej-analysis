import React from 'react';
import { render, screen } from '@testing-library/react';

import Link from './Link';

jest.mock('frontend/hooks/useBasePath', () => jest.fn(() => '/base'));

const mockLinkProps = jest.fn();
jest.mock('next/link', () => (props: any) => {
    mockLinkProps(props);

    return <a {...props}>{props.children}</a>;
});

describe('<Link />', () => {
    it('should prefix relative href with base path', () => {
        render(<Link href='/page'>Page</Link>);

        expect(mockLinkProps).toHaveBeenCalledWith(
            expect.objectContaining({
                href: '/base/page',
            }),
        );
    });

    it('should prefix relative as prop with base path', () => {
        render(
            <Link href='/page' as='/modifiedPage'>
                Page
            </Link>,
        );

        expect(mockLinkProps).toHaveBeenCalledWith(
            expect.objectContaining({
                as: '/base/modifiedPage',
            }),
        );
    });

    it('should not modify absolute href with http prefix', () => {
        render(<Link href='http://example.com/page'>External</Link>);

        expect(mockLinkProps).toHaveBeenCalledWith(
            expect.objectContaining({
                href: 'http://example.com/page',
            }),
        );
    });

    it('should not modify href that already starts with the base path', () => {
        render(<Link href='/base/page'>Already Prefixed</Link>);

        expect(mockLinkProps).toHaveBeenCalledWith(
            expect.objectContaining({
                href: '/base/page',
            }),
        );
    });

    it('should render children correctly', () => {
        render(<Link href='/page'>Page</Link>);

        const component = screen.getByText('Page');

        expect(component).toBeDefined();
    });

    it('should render props correctly', () => {
        render(
            <Link href='/page' target='_blank' className='class' rel='foo'>
                Page
            </Link>,
        );

        const link = screen.getByRole('link');

        expect(link).toHaveAttribute('target', '_blank');
        expect(link).toHaveClass('class');
        expect(link).toHaveAttribute('rel', 'foo');
    });
});
