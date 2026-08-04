import { render, screen } from '@testing-library/react';

import SitecoreDictionary from 'models/enum/SitecoreDictionary';
import SiteSettings from 'models/enum/SiteSettings';

import { HotelDeposit } from './HotelDeposit';

jest.mock(
    'frontend/components/common/Pills/PricePill/PricePill',
    () =>
        ({ children, isSmall, isGreen, tooltipMessage }) =>
            (
                <div
                    data-tid='price-pill'
                    data-issmall={isSmall ? 'true' : 'false'}
                    data-isgreen={isGreen ? 'true' : 'false'}
                    title={tooltipMessage || ''}
                >
                    {children}
                </div>
            ),
);

describe('HotelDeposit', () => {
    const resetMocks = () => ({
        getPhrase: jest.fn(key => {
            const phrases = {
                [SitecoreDictionary.BasketLabelsHotelDeposit]: `${SitecoreDictionary.BasketLabelsHotelDeposit} {depositPrice}`,
                [SitecoreDictionary.BasketLabelsHotelDepositOneGuest]: `${SitecoreDictionary.BasketLabelsHotelDepositOneGuest} {depositPrice}`,
                [SitecoreDictionary.SearchResultsLabelsHotelDeposit]: `${SitecoreDictionary.SearchResultsLabelsHotelDeposit} {depositPrice}`,
                [SitecoreDictionary.SearchResultsLabelsHotelDepositOneGuest]: `${SitecoreDictionary.SearchResultsLabelsHotelDepositOneGuest} {depositPrice}`,
            };

            return phrases[key] || key;
        }),
        countryCode: 'countryCode',
        isPillVisible: jest.fn(() => true),
        offer: null,
        isPricePPShown: false,
        isSmall: false,
        tooltipMessage: 'test-tooltip' as any,
        defaultDepositPrice: '60£',
        isFlightAndHotelPackage: false,
    });

    let mocks = resetMocks();

    beforeEach(() => {
        mocks = resetMocks();
    });

    describe('Pill visibility', () => {
        it('should render pill when isPillVisible returns true', () => {
            render(<HotelDeposit {...mocks} />);

            expect(screen.getByTestId('price-pill')).toBeInTheDocument();

            expect(mocks.isPillVisible).toHaveBeenCalledTimes(1);
            expect(mocks.isPillVisible).toHaveBeenCalledWith(SiteSettings.DepositPill, 'countryCode');
        });

        it('should NOT render pill when isPillVisible returns false', () => {
            mocks.isPillVisible.mockReturnValueOnce(false);

            render(<HotelDeposit {...mocks} />);

            expect(screen.queryByTestId('price-pill')).not.toBeInTheDocument();
            expect(mocks.isPillVisible).toHaveBeenCalledTimes(1);
            expect(mocks.isPillVisible).toHaveBeenCalledWith(SiteSettings.DepositPill, 'countryCode');
        });

        it('should NOT render pill when isFlightAndHotelPackage is true', () => {
            mocks.isPillVisible.mockReturnValueOnce(true);
            mocks.isFlightAndHotelPackage = true;

            render(<HotelDeposit {...mocks} />);

            expect(screen.queryByTestId('price-pill')).not.toBeInTheDocument();
        });
    });

    describe('Label', () => {
        it('should render large label without price pp', () => {
            mocks.isPricePPShown = false;
            mocks.isSmall = false;
            render(<HotelDeposit {...mocks} />);

            expect(screen.getByTestId('price-pill')).toHaveTextContent(
                `${SitecoreDictionary.SearchResultsLabelsHotelDepositOneGuest} ${mocks.defaultDepositPrice}`,
            );
        });

        it('should render large label with price pp', () => {
            mocks.isPricePPShown = true;
            mocks.isSmall = false;
            render(<HotelDeposit {...mocks} />);

            expect(screen.getByTestId('price-pill')).toHaveTextContent(
                `${SitecoreDictionary.SearchResultsLabelsHotelDeposit} ${mocks.defaultDepositPrice}`,
            );
        });

        it('should render small label without price pp', () => {
            mocks.isSmall = true;
            mocks.isPricePPShown = false;
            render(<HotelDeposit {...mocks} />);

            expect(screen.getByTestId('price-pill')).toHaveTextContent(
                `${SitecoreDictionary.BasketLabelsHotelDepositOneGuest} ${mocks.defaultDepositPrice}`,
            );
        });

        it('should render small label with price pp', () => {
            mocks.isSmall = true;
            mocks.isPricePPShown = true;
            render(<HotelDeposit {...mocks} />);

            expect(screen.getByTestId('price-pill')).toHaveTextContent(
                `${SitecoreDictionary.BasketLabelsHotelDeposit} ${mocks.defaultDepositPrice}`,
            );
        });
    });

    describe('Tooltip Message', () => {
        it('should pass tooltipMessage to PricePill', () => {
            mocks.tooltipMessage = 'Custom deposit tooltip';
            render(<HotelDeposit {...mocks} />);

            expect(screen.getByTestId('price-pill')).toHaveAttribute('title', 'Custom deposit tooltip');
        });

        it('should pass empty string for title if tooltipMessage is not provided to PricePill mock', () => {
            mocks.tooltipMessage = undefined;
            render(<HotelDeposit {...mocks} />);
            expect(screen.getByTestId('price-pill')).toHaveAttribute('title', '');
        });
    });
});
