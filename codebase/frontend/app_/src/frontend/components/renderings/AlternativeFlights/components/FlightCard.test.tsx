import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { mockFlightsRoutes } from 'frontend/__mocks__';
import { isPricePPShown } from 'frontend/utils/offer.utils';
import { IAlternativeOffer } from 'models/data/IAlternativeOffers';
import { IOffer, ITransport } from 'models/data/IOffer';
import SitecoreDictionary from 'models/enum/SitecoreDictionary';

import { FlightCard, IFlightCardProps } from './FlightCard';

jest.mock('frontend/utils/offer.utils', () => ({ isPricePPShown: jest.fn(() => true) }));

jest.mock('frontend/components/common/ErrataInfo/FlightErrata', () => ({ errataFlightInfo }) => (
    <div data-tid='flight-errata'>{errataFlightInfo.join(', ')}</div>
));

jest.mock('frontend/components/common/BlockSelected', () => ({ siteCoreKey }) => (
    <div data-tid='selected-block'>{siteCoreKey}</div>
));

jest.mock('frontend/components/common/FlightsDetails/Flight/Flight', () => ({ route }) => (
    <div>{route.direction} flight</div>
));

const transportMock = {
    errataFlightInfo: ['errata 1', 'errata 2'],
    routes: [...mockFlightsRoutes],
} as ITransport;

const offerMock = {
    price: 200,
    pricePP: 100,
    accom: {
        code: 'test',
        packageId: 'packageId',
    },
    transport: transportMock,
} as IOffer;

const createProps = () =>
    ({
        offer: offerMock,
        priceDifference: 1,
        dataTid: 'flight-card',
        isSelected: false,
        isChangeable: false,
        onClickChange: jest.fn(),
        onClickSelect: jest.fn(),
    } as IFlightCardProps);

const createStores = () => ({
    layoutStore: {
        isTradePortal: false,
        isPricesHidden: false,
        isErrataEnabled: true,
        getPhrase: jest.fn(key => key),
    },
    marketStore: { formatMoney: jest.fn(a => `${a > 0 ? '+' : a < 0 ? '-' : ''}£${Math.trunc(a)}`) },
});

let mockStores = createStores();
let mockProps = createProps();

jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useContext: () => mockStores,
}));

describe('<FlightCard />', () => {
    beforeEach(() => {
        mockStores = createStores();
        mockProps = createProps();
    });

    it('Should render card with flights', () => {
        render(<FlightCard {...mockProps} />);

        expect(screen.getByTestId('flight-card')).toBeInTheDocument();
        expect(screen.getByTestId('flight-errata')).toHaveTextContent('errata 1, errata 2');

        expect(screen.getByText('outbound flight')).toBeInTheDocument();
        expect(screen.getByText('inbound flight')).toBeInTheDocument();
        expect(screen.getByText('+£1')).toBeInTheDocument();
        expect(screen.getByText(SitecoreDictionary.GlobalsPriceLabelsPerPerson)).toBeInTheDocument();
        expect(screen.getByTestId('select-button')).toHaveTextContent(
            SitecoreDictionary.AlternativeFlightsButtonsSelect,
        );

        expect(screen.queryByTestId('selected-block')).not.toBeInTheDocument();
        expect(screen.queryByTestId('change-button')).not.toBeInTheDocument();
    });

    it('Should render card without flights', () => {
        mockProps.offer = {} as IAlternativeOffer;

        render(<FlightCard {...mockProps} />);

        expect(screen.getByTestId('flight-card')).toBeInTheDocument();

        expect(screen.queryByText('outbound flight')).not.toBeInTheDocument();
        expect(screen.queryByText('inbound flight')).not.toBeInTheDocument();
    });

    it('Should render selected block when isSelected === true', () => {
        mockProps.isSelected = true;

        render(<FlightCard {...mockProps} />);

        expect(screen.getByTestId('selected-block')).toHaveTextContent(
            SitecoreDictionary.AlternativeFlightsButtonsSelected,
        );
        expect(screen.queryByTestId('select-button')).not.toBeInTheDocument();
    });

    it('Should call onClickSelect when select button clicked', async () => {
        render(<FlightCard {...mockProps} />);

        await userEvent.click(screen.getByTestId('select-button'));

        expect(mockProps.onClickSelect).toHaveBeenCalled();
    });

    it('Should render change button AND call onClickChange when change button clicked', async () => {
        mockProps.isChangeable = true;

        render(<FlightCard {...mockProps} />);

        const button = screen.getByTestId('change-button');
        expect(button).toHaveTextContent(SitecoreDictionary.AlternativeFlightsButtonsChange);
        expect(screen.queryByTestId('select-button')).not.toBeInTheDocument();

        await userEvent.click(button);

        expect(mockProps.onClickChange).toHaveBeenCalled();
    });

    describe('Price', () => {
        it('Should NOT render price when price hidden on trade portal', () => {
            mockStores.layoutStore.isTradePortal = true;
            mockStores.layoutStore.isPricesHidden = true;

            render(<FlightCard {...mockProps} />);

            expect(screen.queryByText('+£99')).not.toBeInTheDocument();
        });

        it('Should NOT render pp label', () => {
            (isPricePPShown as jest.MockedFn<typeof isPricePPShown>).mockReturnValueOnce(false);

            render(<FlightCard {...mockProps} />);

            expect(screen.queryByText(SitecoreDictionary.GlobalsPriceLabelsPerPerson)).not.toBeInTheDocument();
        });
    });

    describe('Errata info', () => {
        it('Should NOT render errata info when no errata', () => {
            mockProps.offer.transport.errataFlightInfo = [];

            render(<FlightCard {...mockProps} />);

            expect(screen.queryByTestId('flight-errata')).not.toBeInTheDocument();
        });

        it('Should NOT render errata info when errata is disabled', () => {
            mockStores.layoutStore.isErrataEnabled = false;

            render(<FlightCard {...mockProps} />);

            expect(screen.queryByTestId('flight-errata')).not.toBeInTheDocument();
        });
    });
});
