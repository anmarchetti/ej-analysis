import * as React from 'react';
import { render, screen, within } from '@testing-library/react';

import { BasketDiagonalCells } from './BasketDiagonalCells';

jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useContext: () => ({ layoutStore: { getPhrase: jest.fn(p => p) } }),
}));

jest.mock('frontend/components/common/StartBookingButton', () => ({
    __esModule: true,
    default: props => <div data-tid='start-booking-button'>{props.render()}</div>,
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

let mockContainsLuxuryPromoCode = false;
jest.mock('frontend/utils/offer.utils', () => ({
    containsLuxuryPromoCode: jest.fn(() => mockContainsLuxuryPromoCode),
}));

describe('<BasketDiagonalCells />', () => {
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
        const { container, queryByText } = render(<BasketDiagonalCells {...mocks} />);

        expect(container.querySelector('.basket-cells .diagonal-cells')).not.toBeInTheDocument();
        expect(container.getElementsByClassName('diagonal-cell-separator diagonal-cell-separator--m2m')).toHaveLength(
            2,
        );
        expect(queryByText('BasketFirstCell')).toBeInTheDocument();
        expect(queryByText('BasketSecondCell')).toBeInTheDocument();
        expect(queryByText('BasketThirdCell')).toBeInTheDocument();
    });

    describe('StartBookingButton', () => {
        it('should render with StartBookingButton when isNextButtonVisible is true', () => {
            mocks.isNextButtonVisible = true;
            const { container } = render(<BasketDiagonalCells {...mocks} />);

            expect(container.querySelector('.diagonal-cell--btn')).toBeInTheDocument();
            expect(within(screen.getByTestId('start-booking-button')).getByRole('button')).not.toHaveClass(
                'btn--black',
            );
        });

        it('should render without StartBookingButton when isNextButtonVisible is false', () => {
            const { container } = render(<BasketDiagonalCells {...mocks} />);

            expect(container.querySelector('.diagonal-cell--btn')).not.toBeInTheDocument();
            expect(screen.queryByTestId('start-booking-button')).not.toBeInTheDocument();
        });

        it('should render book btn with correct className when it is luxury package', () => {
            mockContainsLuxuryPromoCode = true;
            mocks.isNextButtonVisible = true;
            render(<BasketDiagonalCells {...mocks} />);

            expect(within(screen.getByTestId('start-booking-button')).getByRole('button')).toHaveClass('btn--black');
        });
    });

    describe('BasketPriceCell', () => {
        it('should render with BasketPriceCell when isNextButtonVisible is true', () => {
            mocks.isPriceVisible = true;
            const { queryByText } = render(<BasketDiagonalCells {...mocks} />);

            expect(queryByText('BasketPriceCell')).toBeInTheDocument();
        });

        it('should render without BasketPriceCell when isNextButtonVisible is false', () => {
            const { queryByText } = render(<BasketDiagonalCells {...mocks} />);

            expect(queryByText('BasketPriceCell')).not.toBeInTheDocument();
        });
    });
});
