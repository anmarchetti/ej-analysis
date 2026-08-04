import React from 'react';
import { render, screen } from '@testing-library/react';

import SitecoreLinkType from 'models/enum/SitecoreLinkType';
import { IHotelLocationLink } from 'frontend/components/renderings/HotelDetails/components/HotelLocation';

import { HotelLocationLabels } from './HotelLocationLabels';

const locationLinks: IHotelLocationLink[] = [
    { key: '1', value: { text: 'Location 1', href: 'https://eeasyjet.com', linktype: SitecoreLinkType.Internal } },
    { key: '2', value: { text: 'Location 2', href: 'https://eeasyjet.com', linktype: SitecoreLinkType.Internal } },
    { key: '3', value: { text: 'Location 3', href: 'https://eeasyjet.com', linktype: SitecoreLinkType.Internal } },
];

describe('<HotelLocationLabels />', () => {
    it('should render location links names separated by commas', () => {
        render(<HotelLocationLabels locationLinks={locationLinks} />);

        const locations = screen.getAllByText(/Location \d/);
        expect(locations).toHaveLength(3);
        expect(locations[0]).toHaveTextContent('Location 1,');
        expect(locations[1]).toHaveTextContent('Location 2,');
        expect(locations[2]).toHaveTextContent('Location 3');
    });

    it('should render a single location link without comma', () => {
        const locationLinksProp = locationLinks.slice(0, 1);

        render(<HotelLocationLabels locationLinks={locationLinksProp} />);

        expect(screen.getByText('Location 1')).toBeInTheDocument();
    });

    it('should not render anything when locationLinks is empty', () => {
        const locationLinks: IHotelLocationLink[] = [];

        const { container } = render(<HotelLocationLabels locationLinks={locationLinks} />);

        expect(container.firstChild).toBeNull();
    });
});
