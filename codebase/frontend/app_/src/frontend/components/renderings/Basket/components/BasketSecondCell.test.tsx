import * as React from 'react';
import { render } from '@testing-library/react';

import { DATE_FORMATS } from 'code/dates';
import { formatDateL10n } from 'frontend/utils/date.utils';
import SitecoreDictionary from 'models/enum/SitecoreDictionary';

import { BasketSecondCell } from './BasketSecondCell';

const createStores = () => ({
    layoutStore: { getPhrase: jest.fn(p => p) },
    appStore: { isScreenExtraSmall: false },
});

let mockStores = createStores();

jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useContext: () => mockStores,
}));

jest.mock('frontend/utils/date.utils', () => ({
    formatDateL10n: jest.fn(),
}));

describe('<BasketSecondCell />', () => {
    const resetMocks = () => ({
        offer: notEmptyOffer,
        className: 'second',
        isABTestingComponent: false,
    });

    const notEmptyOffer = {
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
    } as any;

    let mocks = resetMocks();

    beforeEach(() => {
        mocks = resetMocks();
        mockStores = createStores();
    });

    it('should render', () => {
        const { container } = render(<BasketSecondCell {...mocks} />);

        expect(container.querySelector('.second-cell')).toBeInTheDocument();
    });

    describe('Stay duration', () => {
        it('should call getPhrase with GlobalsLabelsNightSingular when offer stay prop is equal to 1', () => {
            mocks.offer.stay = 1;
            const { container } = render(<BasketSecondCell {...mocks} />);

            expect(container.querySelector('.second-cell')).toBeInTheDocument();
            expect(mockStores.layoutStore.getPhrase).toBeCalledWith(SitecoreDictionary.GlobalsLabelsNightSingular);
        });

        it('should call getPhrase with GlobalsLabelsNightsPlural when offer stay prop is greater than 1', () => {
            mocks.offer.stay = 2;
            const { container } = render(<BasketSecondCell {...mocks} />);

            expect(container.querySelector('.second-cell')).toBeInTheDocument();
            expect(mockStores.layoutStore.getPhrase).toBeCalledWith(SitecoreDictionary.GlobalsLabelsNightsPlural);
        });

        it('should not render duration on AB testing component', () => {
            mocks.isABTestingComponent = true;
            const { queryByTestId } = render(<BasketSecondCell {...mocks} />);

            expect(queryByTestId('stay-duration')).toBeNull();
        });
    });

    describe('isScreenExtraSmall', () => {
        it('should render depPt for inbound and outbound flight when isScreenExtraSmall is false', () => {
            const { queryByTestId } = render(<BasketSecondCell {...mocks} />);

            expect(queryByTestId('departure-airport')).toHaveTextContent(mocks.offer.transport.routes[0].depPt);
            expect(queryByTestId('arrival-airport')).toHaveTextContent(mocks.offer.transport.routes[1].depPt);
        });

        it('should render depName for inbound and outbound flight when isScreenExtraSmall is true', () => {
            mockStores.appStore.isScreenExtraSmall = true;
            const { queryByTestId } = render(<BasketSecondCell {...mocks} />);

            expect(queryByTestId('departure-airport')).toHaveTextContent(mocks.offer.transport.routes[0].depName);
            expect(queryByTestId('arrival-airport')).toHaveTextContent(mocks.offer.transport.routes[1].depName);
        });
    });

    it('should get values from props for outbound, inbound, outboundDepartureDate, inboundDepartureDate', () => {
        (formatDateL10n as any).mockReturnValueOnce('01/01/1900');
        const { queryByText } = render(<BasketSecondCell {...mocks} />);

        expect(queryByText('01/01/1900')).toBeInTheDocument();
        expect(formatDateL10n).toHaveBeenCalledWith(
            mocks.offer.transport.routes[0].depDate,
            DATE_FORMATS.DayOfWeekOrdinalDayMonthYearTimeRange,
        );
        expect(formatDateL10n).toHaveBeenCalledWith(
            mocks.offer.transport.routes[1].depDate,
            DATE_FORMATS.DayOfWeekOrdinalDayMonthYearTimeRange,
        );
    });

    it('should values to be empty for outbound, inbound, outboundDepartureDate, inboundDepartureDate', () => {
        mocks.offer.transport.routes[0].direction = '';
        mocks.offer.transport.routes[1].direction = '';
        const { queryByTestId } = render(<BasketSecondCell {...mocks} />);

        expect(queryByTestId('arrival-date')).toBeInTheDocument();
        expect(queryByTestId('departure-date')).toBeInTheDocument();
        expect(queryByTestId('arrival-date')).toBeEmptyDOMElement();
        expect(queryByTestId('departure-date')).toBeEmptyDOMElement();
    });
});
