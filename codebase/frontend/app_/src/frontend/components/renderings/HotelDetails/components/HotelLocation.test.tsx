import React from 'react';
import { render, screen } from '@testing-library/react';

import { RenderedHotelLocationLinks } from './HotelLocation';

const mockRouterLink = jest.fn();
const mockRouterLinkClick = jest.fn();
jest.mock('frontend/components/common/RouterLink', () => ({ children, link, onClick }) => {
    mockRouterLink({ link, onClick });

    return (
        <a data-tid='mock-router-link' onClick={mockRouterLinkClick}>
            {children}
        </a>
    );
});

describe('<HotelLocation />', () => {
    const resetMocks = () =>
        ({
            hotelLocationLinks: [
                {
                    key: 'key',
                    value: { href: 'href', text: 'text' },
                },
            ],
            separator: '',
            itemClassName: '',
        } as any);

    let props = resetMocks();

    beforeEach(() => {
        props = resetMocks();
    });

    it('should render a single RouterLink when one link is provided', () => {
        render(<RenderedHotelLocationLinks {...props} />);

        const links = screen.getAllByTestId('mock-router-link');
        const linkData = props.hotelLocationLinks[0];

        expect(links).toHaveLength(1);
        expect(links[0]).toHaveTextContent(decodeURIComponent(linkData.value.text));
        expect(mockRouterLink).toHaveBeenCalledWith({
            link: props.hotelLocationLinks[0],
            onClick: expect.any(Function),
        });
    });

    it('should render multiple RouterLinks when multiple links are provided', () => {
        props.hotelLocationLinks = [
            {
                key: 'key1',
                value: { href: 'href1', text: 'text1' },
            },
            {
                key: 'key2',
                value: { href: 'href2', text: 'text2' },
            },
        ];

        render(<RenderedHotelLocationLinks {...props} />);

        const links = screen.getAllByTestId('mock-router-link');
        expect(links).toHaveLength(2);

        const firstLinkData = props.hotelLocationLinks[0];
        expect(mockRouterLink).toHaveBeenNthCalledWith(1, expect.objectContaining({ link: firstLinkData }));

        const secondLinkData = props.hotelLocationLinks[1];
        expect(mockRouterLink).toHaveBeenNthCalledWith(2, expect.objectContaining({ link: secondLinkData }));
    });

    it('should render null if hotelLocationLinks is empty', () => {
        props.hotelLocationLinks = [];

        const { container } = render(<RenderedHotelLocationLinks {...props} />);

        expect(container.firstChild).toBeNull();
        expect(screen.queryAllByTestId('mock-router-link')).toHaveLength(0);
    });

    it('should render null if hotelLocationLinks is not provided (undefined)', () => {
        props.hotelLocationLinks = undefined;

        const { container } = render(<RenderedHotelLocationLinks {...props} />);

        expect(container.firstChild).toBeNull();
        expect(screen.queryAllByTestId('mock-router-link')).toHaveLength(0);
    });

    it('should render separators between links', () => {
        const separator = ' | ';
        props.hotelLocationLinks = [
            {
                key: 'key1',
                value: { href: 'href1', text: 'text1' },
            },
            {
                key: 'key2',
                value: { href: 'href2', text: 'text2' },
            },
        ];
        props.separator = separator;

        render(<RenderedHotelLocationLinks {...props} />);

        expect(screen.getByText(separator.trim())).toBeInTheDocument();

        expect(screen.getByText(decodeURIComponent('text1'))).toBeInTheDocument();
        expect(screen.getByText(decodeURIComponent('text2'))).toBeInTheDocument();
    });

    it('should use a space as a default separator if no separator is provided and there are multiple links', () => {
        props.hotelLocationLinks = [
            {
                key: 'key1',
                value: { href: 'href1', text: 'text1' },
            },
            {
                key: 'key2',
                value: { href: 'href2', text: 'text2' },
            },
        ];
        props.separator = undefined;

        const { container } = render(<RenderedHotelLocationLinks {...props} />);

        const link1 = screen.getByText(decodeURIComponent('text1'));
        const link2 = screen.getByText(decodeURIComponent('text2'));
        expect(link1).toBeInTheDocument();
        expect(link2).toBeInTheDocument();
        expect(container.textContent).toBe('text1 text2');
    });

    it('should correctly decode URI component text for display', () => {
        const encodedText = 'New%20York';
        props.hotelLocationLinks = [{ key: 'loc1', value: { href: '/location/ny', text: encodedText } }];

        render(<RenderedHotelLocationLinks {...props} />);

        expect(screen.getByText('New York')).toBeInTheDocument();
    });

    describe('isFlightAndHotelPackage', () => {
        it('should render plain text spans instead of RouterLinks when isFlightAndHotelPackage is true', () => {
            props.isFlightAndHotelPackage = true;

            render(<RenderedHotelLocationLinks {...props} />);

            expect(screen.queryByTestId('mock-router-link')).not.toBeInTheDocument();
            expect(screen.getByText(decodeURIComponent(props.hotelLocationLinks[0].value.text))).toBeInTheDocument();
        });

        it('should render RouterLinks when isFlightAndHotelPackage is false', () => {
            props.isFlightAndHotelPackage = false;

            render(<RenderedHotelLocationLinks {...props} />);

            expect(screen.getByTestId('mock-router-link')).toBeInTheDocument();
        });

        it('should render multiple plain text spans when isFlightAndHotelPackage is true and multiple links provided', () => {
            props.isFlightAndHotelPackage = true;
            props.hotelLocationLinks = [
                { key: 'key1', value: { href: 'href1', text: 'text1' } },
                { key: 'key2', value: { href: 'href2', text: 'text2' } },
            ];

            render(<RenderedHotelLocationLinks {...props} />);

            expect(screen.queryAllByTestId('mock-router-link')).toHaveLength(0);
            expect(screen.getByText('text1')).toBeInTheDocument();
            expect(screen.getByText('text2')).toBeInTheDocument();
        });
    });
});
