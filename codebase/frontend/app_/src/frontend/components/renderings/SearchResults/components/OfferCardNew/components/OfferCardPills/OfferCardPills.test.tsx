import React from 'react';
import { render } from '@testing-library/react';

import { IHotel } from 'models/data/IHotel';
import { IOffer } from 'models/data/IOffer';
import { IRoute } from 'models/data/IRoute';
import { PlaceholderNames } from 'models/enum/PlaceholderNames';

import OfferCardPills from './OfferCardPills';

const createProps = () => ({
    rendering: '',
    routeDep: {
        depDate: '2019-09-16T14:20:00+00:00',
        depName: 'Palma Airport',
        depPt: 'PMI',
        arrDate: '2019-09-16T11:55:00+00:00',
        arrName: 'London Gatwick Airport',
        arrPt: 'LGW',
    } as IRoute,
    offer: {} as IOffer,
    isEcoCertifiedPill: false,
    isOfferUnavailableInShortlist: false,
});

let mockProps = createProps();

const mockPlaceholderComponent = jest.fn();

jest.mock('@sitecore-jss/sitecore-jss-nextjs', () => ({
    Placeholder: props => {
        mockPlaceholderComponent(props);

        return <div data-tid='placeholder' />;
    },
}));

const mockEcoCertifiedPill = jest.fn();
jest.mock('frontend/components/common/EcoCertifiedPill', () => ({
    __esModule: true,
    default: props => {
        mockEcoCertifiedPill(props);

        return <div data-tid='eco-certified-pill' />;
    },
}));

describe('<OfferCardPills />', () => {
    beforeEach(() => {
        mockProps = createProps();
    });

    it('should render PromotionalMessages if isOfferUnavailableInShortlist if false', () => {
        const { rendering, offer, routeDep } = mockProps;

        render(<OfferCardPills {...mockProps} />);

        expect(mockPlaceholderComponent).toHaveBeenCalledWith({
            name: PlaceholderNames.PromotionalMessages,
            rendering,
            offer,
            routeDep,
        });
    });

    it('should NOT render PromotionalMessages if isOfferUnavailableInShortlist if true', () => {
        mockProps.isOfferUnavailableInShortlist = true;
        const { queryByTestId } = render(<OfferCardPills {...mockProps} />);
        expect(queryByTestId('placeholder')).not.toBeInTheDocument();
    });

    it('should render EcoCertifiedPill if isEcoCertifiedPill and hotel', () => {
        mockProps.isEcoCertifiedPill = true;
        mockProps.offer.hotel = {
            ecoFacility: {
                name: 'test name',
                tooltip: 'test tooltip',
            },
        } as Nullable<IHotel>;

        const { hotel } = mockProps.offer;

        render(<OfferCardPills {...mockProps} />);

        expect(mockEcoCertifiedPill).toHaveBeenCalledWith({
            title: hotel?.ecoFacility.name,
            tooltip: hotel?.ecoFacility.tooltip,
            isNewPill: true,
        });
    });

    it('should NOT render EcoCertifiedPill if isEcoCertifiedPill is false even if hotel data exist', () => {
        mockProps.isEcoCertifiedPill = false;
        mockProps.offer.hotel = {
            ecoFacility: {
                name: 'test name',
                tooltip: 'test tooltip',
            },
        } as Nullable<IHotel>;

        render(<OfferCardPills {...mockProps} />);

        expect(mockEcoCertifiedPill).not.toHaveBeenCalled();
    });

    it('should NOT render EcoCertifiedPill if isEcoCertifiedPill true but hotel data is undefined', () => {
        mockProps.isEcoCertifiedPill = true;

        render(<OfferCardPills {...mockProps} />);

        expect(mockEcoCertifiedPill).not.toHaveBeenCalled();
    });
});
