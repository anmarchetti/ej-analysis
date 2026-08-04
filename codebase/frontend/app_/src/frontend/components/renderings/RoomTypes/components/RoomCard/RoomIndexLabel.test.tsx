import React from 'react';
import { render, screen } from '@testing-library/react';

import { RoomIndexLabel } from './RoomIndexLabel';

let mockUseXSMobileViewport = false;

jest.mock('frontend/hooks/useMediaQuery', () => ({
    useXSMobileViewport: jest.fn(() => mockUseXSMobileViewport),
}));

const createStores = () => ({
    layoutStore: {
        getPhrase: jest.fn(e => e),
    },
});

const createProps = () => ({
    selectedRoomSectionIndex: 0,
    offer: {
        price: 100,
        pricePP: 50,
    },
});

let mockStores;
let props;

jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useContext: () => mockStores,
}));

describe('<RoomIndexLabel />', () => {
    beforeEach(() => {
        props = createProps();
        mockStores = createStores();
        mockUseXSMobileViewport = false;
    });

    it('should render room index label on desktop/tablet (>= 576px)', () => {
        render(<RoomIndexLabel {...props} />);

        expect(screen.getByTestId('room-card-index')).toBeInTheDocument();
    });

    it('should render room index label on mobile when no offer provided (board drawer scenario)', () => {
        props.offer = null;
        mockUseXSMobileViewport = true;

        render(<RoomIndexLabel {...props} />);

        expect(screen.getByTestId('room-card-index')).toBeInTheDocument();
    });

    it('should NOT render room index label on mobile when offer is provided', () => {
        props.offer = { price: 100, pricePP: 50 };
        mockUseXSMobileViewport = true;

        render(<RoomIndexLabel {...props} />);

        expect(screen.queryByTestId('room-card-index')).not.toBeInTheDocument();
    });
});
