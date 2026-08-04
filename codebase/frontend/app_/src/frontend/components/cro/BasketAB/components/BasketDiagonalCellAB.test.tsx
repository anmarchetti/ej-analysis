import * as React from 'react';
import { render } from '@testing-library/react';

import BasketDiagonalCellsAB from './BasketDiagonalCellsAB';

jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useContext: () => ({
        layoutStore: { getPhrase: jest.fn(p => p), isATOLProtectionEnabled: true },
        bookingStore: {
            transfer: {},
            packageInfo: {},
        },
        trackingStore: {
            trackEventWithParams: jest.fn(),
        },
    }),
}));

jest.mock('frontend/components/common/StartBookingButton', () => ({
    __esModule: true,
    default: () => <div>StartBookingButton</div>,
}));

jest.mock('frontend/components/renderings/Basket/components/BasketPriceCell', () => ({
    __esModule: true,
    default: () => <div>BasketPriceCell</div>,
}));

jest.mock('frontend/components/renderings/Basket/components/BasketFirstCell', () => ({
    __esModule: true,
    default: () => <div>BasketFirstCell</div>,
}));

jest.mock('frontend/components/renderings/Basket/components/BasketSecondCell', () => ({
    __esModule: true,
    default: () => <div>BasketSecondCell</div>,
}));

jest.mock('frontend/components/renderings/Basket/components/BasketThirdCell', () => ({
    __esModule: true,
    default: () => <div>BasketThirdCell</div>,
}));

jest.mock('frontend/components/common/Popup', () => ({
    __esModule: true,
    default: () => <div>Popup</div>,
}));

const COUNT_OF_SEPARATORS = 3;

describe('<BasketDiagonalCellsAB />', () => {
    const resetMocks = () => ({
        offer: notEmptyOffer,
        board: null,
        room: null,
        transfers: [],
        className: '',
        totalPricePP: 0,
        isNextButtonVisible: false,
        getPhrase: jest.fn(),
        isPricePPShown: true,
        isPriceVisible: false,
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
                    depDate: '',
                },
                {
                    arrDate: '',
                },
            ],
        },
    } as any;

    let mocks = resetMocks();

    beforeEach(() => {
        mocks = resetMocks();
    });

    it('should render standard', () => {
        const { container, queryByText, queryByTestId } = render(<BasketDiagonalCellsAB {...mocks} />);

        expect(container.querySelector('.basket-cells.diagonal-cells')).toBeInTheDocument();
        expect(container.getElementsByClassName('diagonal-cell-separator diagonal-cell-separator--m2m')).toHaveLength(
            COUNT_OF_SEPARATORS,
        );
        expect(queryByText('BasketFirstCell')).toBeInTheDocument();
        expect(queryByText('BasketSecondCell')).toBeInTheDocument();
        expect(queryByText('BasketThirdCell')).toBeInTheDocument();
        expect(queryByTestId('show-more-details')).toBeInTheDocument();
        expect(queryByTestId('atol-protected')).toBeInTheDocument();
    });

    describe('StartBookingButton', () => {
        it('should render with StartBookingButton when isNextButtonVisible is true', () => {
            mocks.isNextButtonVisible = true;
            const { container, queryByText } = render(<BasketDiagonalCellsAB {...mocks} />);

            expect(container.querySelector('.diagonal-cell--btn')).toBeInTheDocument();
            expect(queryByText('StartBookingButton')).toBeInTheDocument();
        });

        it('should render without StartBookingButton when isNextButtonVisible is false', () => {
            const { container, queryByText } = render(<BasketDiagonalCellsAB {...mocks} />);

            expect(container.querySelector('.diagonal-cell--btn')).not.toBeInTheDocument();
            expect(queryByText('StartBookingButton')).not.toBeInTheDocument();
        });
    });

    describe('BasketPriceCell', () => {
        it('should render with BasketPriceCell when isNextButtonVisible is true', () => {
            mocks.isPriceVisible = true;
            const { queryByText } = render(<BasketDiagonalCellsAB {...mocks} />);

            expect(queryByText('BasketPriceCell')).toBeInTheDocument();
        });

        it('should render without BasketPriceCell when isNextButtonVisible is false', () => {
            const { queryByText } = render(<BasketDiagonalCellsAB {...mocks} />);

            expect(queryByText('BasketPriceCell')).not.toBeInTheDocument();
        });
    });

    describe('Popup', () => {
        it('should not render Popup by default', async () => {
            const { queryByText } = render(<BasketDiagonalCellsAB {...mocks} />);

            expect(queryByText('Popup')).not.toBeInTheDocument();
        });
    });
});
