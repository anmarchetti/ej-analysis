import React from 'react';
import { render, screen } from '@testing-library/react';

import SitecoreDictionary from 'models/enum/SitecoreDictionary';
import { mockIframeOffer } from 'frontend/components/renderings/iframe/IframeHolidaysCarousel/__mocks__/iframe.mocks';

import { HolidayCardImage } from './HolidayCardImage';

jest.mock('frontend/components/common/OfferCardSlider/OfferCardSlider', () => () => <div data-tid='images-carousel' />);

jest.mock('frontend/components/common/LikeBadge', () => ({ text }) => <div data-tid='like-badge'>{text}</div>);

jest.mock('frontend/components/common/LuxuryBadge/LuxuryBadge', () => ({ wrapperClassName }) => (
    <div data-tid='luxury-badge' className={wrapperClassName}>
        Luxury Badge
    </div>
));

const createProps = () => ({
    offer: { ...mockIframeOffer },
    fallbackImage: 'fallbackImage',
    isLuxuryPackage: false,
});

const createStores = () => ({
    layoutStore: { getPhrase: jest.fn(p => p), isWeLovePillEnabled: false },
});

let mockProps;
let mockStores;

jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useContext: () => mockStores,
}));

describe('<HolidayCardImage />', () => {
    beforeEach(() => {
        mockProps = createProps();
        mockStores = createStores();
    });

    it('should render image carousel', () => {
        render(<HolidayCardImage {...mockProps} />);

        expect(screen.getByTestId('images-carousel')).toBeInTheDocument();
    });

    it('should render like badge if we love pill is enabled', () => {
        mockStores.layoutStore.isWeLovePillEnabled = true;
        render(<HolidayCardImage {...mockProps} />);

        expect(screen.getByTestId('like-badge')).toBeInTheDocument();
        expect(screen.getByTestId('like-badge')).toHaveTextContent(
            SitecoreDictionary.IframePromotingHolidaysLabelsWeLove,
        );
    });

    it('should not render like badge if we love pill is disabled', () => {
        mockStores.layoutStore.isWeLovePillEnabled = false;
        render(<HolidayCardImage {...mockProps} />);

        expect(screen.queryByTestId('like-badge')).toBeNull();
    });

    it('should not render like badge if hotel is external', () => {
        mockStores.layoutStore.isWeLovePillEnabled = true;
        mockProps.offer.accom.isExt = true;
        render(<HolidayCardImage {...mockProps} />);

        expect(screen.queryByTestId('like-badge')).toBeNull();
    });

    it('should render luxury badge if isLuxuryPackage is true', () => {
        mockProps.isLuxuryPackage = true;
        render(<HolidayCardImage {...mockProps} />);

        expect(screen.getByTestId('luxury-badge')).toBeInTheDocument();
    });
});
