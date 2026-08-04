import React from 'react';
import { render, screen } from '@testing-library/react';

import { mockCabinBagsFields } from 'frontend/__mocks__/cabinBags';
import { GuestType } from 'models/enum/GuestType';
import { GuestInfo } from 'models/GuestInfo';

import { CabinBagsRouteInfo, ICabinBagsRouteInfoProps } from './CabinBagsRouteInfo';

const includedLineMock = {
    field: mockCabinBagsFields.IncludedIcon,
    className: 'icon',
    'data-tid': 'included-bag-icon',
};

const createProps = (): ICabinBagsRouteInfoProps => ({
    numberOfBags: 2,
    fields: mockCabinBagsFields,
    isOverheadShown: true,
});

const createStores = () => ({
    guestDetailsStore: {
        infants: [] as GuestInfo[],
    },
    flightsPassengersStore: { LCBCount: 0 },
});

let mockProps = createProps();
let mockStores = createStores();

jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useContext: () => mockStores,
}));

const mockJSSImage = jest.fn();
jest.mock('frontend/components/common/JSSImage', () => ({
    __esModule: true,
    default: ({ ...props }) => {
        mockJSSImage(props);

        return <div data-tid='jss-image' />;
    },
}));

describe('<CabinBagsRouteInfo />', () => {
    beforeEach(() => {
        mockProps = createProps();
        mockStores = createStores();
    });

    describe('Included bags line', () => {
        it('should be shown', () => {
            render(<CabinBagsRouteInfo {...mockProps} />);

            const lines = screen.getAllByTestId('lcb-bag-type');
            expect(lines.length).toBe(3);
            expect(lines[0]).toHaveTextContent('2 x small under seat bags');
            expect(lines[0]).toHaveClass('bagType');
            expect(mockJSSImage).toHaveBeenNthCalledWith(1, includedLineMock);
        });

        it('should be shown with infant label', () => {
            mockStores.guestDetailsStore.infants = [
                { type: GuestType.Infant, firstName: 'Infant' },
                { type: GuestType.Infant, firstName: 'Infant' },
            ] as GuestInfo[];

            render(<CabinBagsRouteInfo {...mockProps} />);

            const lines = screen.getAllByTestId('lcb-bag-type');
            expect(lines.length).toBe(3);
            expect(lines[0]).toHaveTextContent('2 x small under seat bags, 2 x baby change bags');
            expect(lines[0]).toHaveClass('bagType');
            expect(mockJSSImage).toHaveBeenNthCalledWith(1, includedLineMock);
        });
    });

    describe('Added Bags line', () => {
        it('should be shown when LCBCount > 0', () => {
            mockStores.flightsPassengersStore.LCBCount = 1;

            render(<CabinBagsRouteInfo {...mockProps} />);

            const lines = screen.getAllByTestId('lcb-bag-type');

            expect(lines.length).toBe(3);
            expect(lines[2]).toHaveTextContent('1 x small under seat bags');
            expect(lines[2]).toHaveClass('bagType');
            expect(mockJSSImage).toHaveBeenNthCalledWith(3, {
                field: mockCabinBagsFields.OverheadAddedIcon,
                className: 'icon',
                'data-tid': 'overhead-bag-added-icon',
            });
        });

        it('should be hidden when LCBCount = 0 ', () => {
            mockStores.flightsPassengersStore.LCBCount = 0;

            render(<CabinBagsRouteInfo {...mockProps} />);

            const lines = screen.getAllByTestId('lcb-bag-type');

            expect(lines.length).toBe(3);
            expect(lines[2]).toHaveClass('bagType d-none');
        });
    });

    describe('Bags are not added line', () => {
        it('should be hidden when isOverheadShown = false and LCBCount = 0', () => {
            mockProps.isOverheadShown = false;
            mockStores.flightsPassengersStore.LCBCount = 0;

            render(<CabinBagsRouteInfo {...mockProps} />);

            const lines = screen.getAllByTestId('lcb-bag-type');

            expect(lines.length).toBe(3);
            expect(lines[1]).toHaveClass('bagType d-none');
        });

        it('should be hidden when isOverheadShown=true and LCBCount>0', () => {
            mockProps.isOverheadShown = true;
            mockStores.flightsPassengersStore.LCBCount = 1;

            render(<CabinBagsRouteInfo {...mockProps} />);

            const lines = screen.getAllByTestId('lcb-bag-type');

            expect(lines.length).toBe(3);
            expect(lines[1]).toHaveClass('bagType d-none');
        });

        it('should be shown when isOverheadShown = true and LCBCount = 0 ', () => {
            mockProps.isOverheadShown = true;
            mockStores.flightsPassengersStore.LCBCount = 0;

            render(<CabinBagsRouteInfo {...mockProps} />);

            const lines = screen.getAllByTestId('lcb-bag-type');

            expect(lines.length).toBe(3);
            expect(lines[1]).toHaveClass('bagType');
            expect(mockJSSImage).toHaveBeenNthCalledWith(2, {
                field: mockProps.fields.OverheadIcon,
                className: 'icon',
                'data-tid': 'overhead-bag-not-added-icon',
            });
        });
    });
});
