import React from 'react';
import { render, screen } from '@testing-library/react';

import { CurrencyCode } from 'code/currency';
import { createMockStores } from 'frontend/__mocks__';
import { mockedTransport } from 'frontend/__mocks__/transport';

import AmendFlightCard, { IAmendFlightCardProps } from './AmendFlightCard';

const createStores = () =>
    createMockStores({
        layoutStore: {
            isErrataEnabled: true,
        },
    });

const createProps = (): IAmendFlightCardProps => ({
    currency: CurrencyCode.GBP,
    routes: mockedTransport.routes,
    priceDifference: 15.01,
    dataTid: '',
    isSelected: false,
    onClickSelect: jest.fn(),
    feeLabel: 'feeLabel',
    priceTooltipText: <div>priceTooltipText</div>,
});

let mockProps;
let mockStores = createStores();

jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useContext: () => mockStores,
}));

jest.mock('frontend/utils/date.utils', () => ({
    formatDateL10n: jest.fn(),
}));

jest.mock('frontend/components/common/ErrorMessage', () => ({
    __esModule: true,
    default: () => <div data-tid='error-message' />,
}));

const mockAmendFlightCardActionsProps = jest.fn();
jest.mock(
    'frontend/components/renderings/AmendFlights/components/AmendFlightCard/components/AmendFlightCardActions/AmendFlightCardActions',
    () => ({
        __esModule: true,
        default: (props: any) => {
            mockAmendFlightCardActionsProps(props);

            return <div data-tid='amend-flight-card-actions' />;
        },
    }),
);

describe('<AmendFlightCard />', () => {
    beforeEach(() => {
        mockProps = createProps();
        mockStores = createStores();
    });

    it('should render routes', () => {
        const { getByTestId } = render(<AmendFlightCard {...mockProps} />);
        expect(getByTestId('outbound-flight')).toBeInTheDocument();
        expect(getByTestId('inbound-flight')).toBeInTheDocument();
    });

    it('should render error message if not available', () => {
        mockProps.notAvailable = true;

        render(<AmendFlightCard {...mockProps} />);
        expect(screen.getByTestId('error-message')).toBeInTheDocument();
    });

    describe('Selected/Unselected Card', () => {
        it('should render selected Card without button and price', () => {
            mockProps.isSelected = true;
            const { queryByRole, container } = render(<AmendFlightCard {...mockProps} />);

            expect(container.getElementsByClassName('block-selected')).toHaveLength(1);
            expect(queryByRole('button')).not.toBeInTheDocument();
        });

        it('should render AmendFlightCardActions component', () => {
            render(<AmendFlightCard {...mockProps} />);

            expect(screen.getByTestId('amend-flight-card-actions')).toBeInTheDocument();
            expect(mockAmendFlightCardActionsProps).toHaveBeenCalledWith(
                expect.objectContaining({
                    priceDifference: 16,
                    currency: 'GBP',
                    feeLabel: 'feeLabel',
                    onClickSelect: mockProps.onClickSelect,
                }),
            );
        });
    });

    describe('Errata', () => {
        it('should render ErrataFlightInfo if errataFlightInfo props is NOT empty array', () => {
            mockProps.errataFlightInfo = ['errata first'];
            const { queryByText } = render(<AmendFlightCard {...mockProps} />);

            expect(queryByText('errata first')).toBeInTheDocument();
        });

        it('should NOT render ErrataFlightInfo if errataFlightInfo props is empty array', () => {
            mockProps.errataFlightInfo = [];

            const { queryByText } = render(<AmendFlightCard {...mockProps} />);

            expect(queryByText('errata first')).not.toBeInTheDocument();
        });

        it('should NOT render flight errata if errata is disabled', () => {
            mockProps.errataFlightInfo = ['errata first'];
            mockStores.layoutStore.isErrataEnabled = false;
            const { queryByText } = render(<AmendFlightCard {...mockProps} />);

            expect(queryByText('errata first')).not.toBeInTheDocument();
        });
    });
});
