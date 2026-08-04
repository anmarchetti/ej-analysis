import * as React from 'react';
import { render, screen } from '@testing-library/react';

import { DATE_FORMATS } from 'code/dates';
import { formatDateL10n } from 'frontend/utils/date.utils';
import { IOfferWithoutAltBoards } from 'models/data/IOffer';
import { RouteDirection } from 'models/enum/RouteDirection';
import SitecoreDictionary from 'models/enum/SitecoreDictionary';

import { BasketSecondCellAB, IBasketSecondCellABProps } from './BasketSecondCellAB';

const notEmptyOffer: IOfferWithoutAltBoards = {
    accom: {
        unit: [
            {
                occupation: {
                    adults: 2,
                    children: 0,
                },
            },
        ],
    },
    transport: {
        routes: [
            {
                direction: 'outbound',
                arrDate: '2019-09-16T14:20:00+00:00',
                arrName: 'Palma Airport',
                arrPt: 'PMI',
                depDate: '2019-09-16T11:55:00+00:00',
                depName: 'London Gatwick Airport',
                depPt: 'LGW',
            },
            {
                direction: 'inbound',
                depDate: '2019-09-16T14:20:00+00:00',
                depName: 'Palma Airport',
                depPt: 'PMI',
                arrDate: '2019-09-16T11:55:00+00:00',
                arrName: 'London Gatwick Airport',
                arrPt: 'LGW',
            },
        ],
    },
} as IOfferWithoutAltBoards;

const createProps = (): IBasketSecondCellABProps => ({
    offer: notEmptyOffer,
    className: 'second',
});

const createStores = () => ({
    layoutStore: { getPhrase: jest.fn(p => p) },
    appStore: { isScreenExtraSmall: false },
});

let mockProps = createProps();
let mockStores = createStores();

jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useContext: () => mockStores,
}));

describe('<BasketSecondCellAB />', () => {
    beforeEach(() => {
        mockProps = createProps();
        mockStores = createStores();
    });

    it('should render', () => {
        render(<BasketSecondCellAB {...mockProps} />);

        expect(screen.getByTestId('second-cell')).toBeInTheDocument();
    });

    describe('Stay duration', () => {
        it('should call getPhrase with GlobalsLabelsNightSingular when offer stay prop is equal to 1', () => {
            mockProps.offer.stay = 1;
            render(<BasketSecondCellAB {...mockProps} />);

            expect(screen.getByTestId('second-cell')).toBeInTheDocument();
            expect(mockStores.layoutStore.getPhrase).toBeCalledWith(SitecoreDictionary.GlobalsLabelsNightSingular);
        });

        it('should call getPhrase with GlobalsLabelsNightsPlural when offer stay prop is greater than 1', () => {
            mockProps.offer.stay = 2;
            render(<BasketSecondCellAB {...mockProps} />);

            expect(screen.getByTestId('second-cell')).toBeInTheDocument();
            expect(mockStores.layoutStore.getPhrase).toBeCalledWith(SitecoreDictionary.GlobalsLabelsNightsPlural);
        });
    });

    describe('isScreenExtraSmall', () => {
        it('should render depPt for inbound and outbound flight when isScreenExtraSmall is false', () => {
            render(<BasketSecondCellAB {...mockProps} />);

            expect(screen.queryByTestId('departure-airport')).toHaveTextContent(
                mockProps.offer.transport.routes[0].depPt,
            );
            expect(screen.queryByTestId('arrival-airport')).toHaveTextContent(
                mockProps.offer.transport.routes[1].depPt,
            );
        });

        it('should render depName for inbound and outbound flight when isScreenExtraSmall is true', () => {
            mockStores.appStore.isScreenExtraSmall = true;
            render(<BasketSecondCellAB {...mockProps} />);

            expect(screen.queryByTestId('departure-airport')).toHaveTextContent(
                mockProps.offer.transport.routes[0].depName,
            );
            expect(screen.queryByTestId('arrival-airport')).toHaveTextContent(
                mockProps.offer.transport.routes[1].depName,
            );
        });
    });

    it('should get values from props for outbound, inbound, outboundDepartureDate, inboundDepartureDate', () => {
        render(<BasketSecondCellAB {...mockProps} />);

        expect(
            screen.queryByText(formatDateL10n(mockProps.offer.transport.routes[0].depDate, DATE_FORMATS.fullDateTime)),
        ).toBeInTheDocument();
        expect(
            screen.queryByText(formatDateL10n(mockProps.offer.transport.routes[1].depDate, DATE_FORMATS.fullDateTime)),
        ).toBeInTheDocument();
    });

    it('should values to be empty for outbound, inbound, outboundDepartureDate, inboundDepartureDate', () => {
        mockProps.offer.transport.routes[0].direction = '' as RouteDirection;
        mockProps.offer.transport.routes[1].direction = '' as RouteDirection;
        render(<BasketSecondCellAB {...mockProps} />);

        expect(screen.queryByTestId('arrival-date')).toBeInTheDocument();
        expect(screen.queryByTestId('departure-date')).toBeInTheDocument();
        expect(screen.queryByTestId('arrival-date')).toBeEmptyDOMElement();
        expect(screen.queryByTestId('departure-date')).toBeEmptyDOMElement();
    });
});
