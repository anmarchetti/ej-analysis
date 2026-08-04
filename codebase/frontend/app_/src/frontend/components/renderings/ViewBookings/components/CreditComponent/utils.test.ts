import { marketCredit, multipleCreditBalance } from './mocks';
import { getCreditsLabels } from './utils';

const marketCreditBalance = 100;
const fewCreditsCurrency = multipleCreditBalance;
const oneCreditCurrency = [{ ...marketCredit }];
const oneZeroCredit = { ...marketCredit, balance: 0, hasCreditHistory: false };

const getPhrase = jest.fn(p => p);

describe('getCreditsLabels', () => {
    it('should return view credit title and description, view creditS button when user has credits in multiple currencies and gift card is enabled', () => {
        expect(getCreditsLabels(fewCreditsCurrency, marketCreditBalance, true, getPhrase)).toMatchObject({
            title: 'ViewBookings.Titles.ViewCreditCards',
            description: 'ViewBookings.Labels.ViewCreditCards',
            creditButtonText: 'ViewBookings.Buttons.ViewCredits',
        });
    });

    it('should return creditS title, description and button when user has credits in multiple currencies and gift card is not enabled', () => {
        expect(getCreditsLabels(fewCreditsCurrency, marketCreditBalance, false, getPhrase)).toMatchObject({
            title: 'ViewBookings.Titles.ViewCreditCards',
            description: 'ViewBookings.Labels.ViewCreditCards',
            creditButtonText: 'ViewBookings.Buttons.ViewCredits',
        });
    });

    it('should return credit title, description and button, and credit amount when user has credit in one currency and gift card is enabled', () => {
        expect(getCreditsLabels(oneCreditCurrency, marketCreditBalance, true, getPhrase)).toMatchObject({
            title: 'ViewBookings.Titles.ViewCreditCard',
            description: 'ViewBookings.Labels.ViewCreditCard',
            creditButtonText: 'ViewBookings.Buttons.ViewCredit',
            creditAmount: marketCreditBalance,
        });
    });

    it('should return creditS title, description and button when user has credit in one currency in another market and gift card is not enabled', () => {
        expect(getCreditsLabels(oneCreditCurrency, 0, false, getPhrase)).toMatchObject({
            title: 'ViewBookings.Titles.ViewCreditCards',
            description: 'ViewBookings.Labels.ViewCreditCards',
            showMultipleCurrenciesInfo: true,
            creditButtonText: 'ViewBookings.Buttons.ViewCredits',
        });
    });

    it('should return creditS title, description and button when user has credit in one currency in another market and gift card is enabled', () => {
        expect(getCreditsLabels(oneCreditCurrency, 0, true, getPhrase)).toMatchObject({
            title: 'ViewBookings.Titles.ViewCreditCards',
            description: 'ViewBookings.Labels.ViewCreditCards',
            showMultipleCurrenciesInfo: true,
            creditButtonText: 'ViewBookings.Buttons.ViewCredits',
        });
    });

    it('should return credit title, description and button, and credit amount when user has credit in one currency and gift card is not enabled', () => {
        expect(getCreditsLabels(oneCreditCurrency, marketCreditBalance, false, getPhrase)).toMatchObject({
            title: 'ViewBookings.Titles.ViewCreditCard',
            description: 'ViewBookings.Labels.ViewCreditCard',
            creditButtonText: 'ViewBookings.Buttons.ViewCredit',
        });
    });

    it('should return gift card title, description when user has not credits and gift card is enabled', () => {
        expect(getCreditsLabels([], 0, true, getPhrase)).toMatchObject({
            title: 'ViewBookings.Titles.RedeemVoucher',
            description: 'ViewBookings.Labels.RedeemVoucher',
        });
    });

    it('should return view credit title, description and button when user has not credits and gift card is not enabled', () => {
        expect(getCreditsLabels([], 0, false, getPhrase)).toMatchObject({
            title: 'ViewBookings.Titles.ViewCreditCard',
            description: 'ViewBookings.Labels.ViewCreditCard',
            creditButtonText: 'ViewBookings.Buttons.ViewCredit',
        });
    });

    it('should return gift card title, description when user has one zero credit and gift card is enabled', () => {
        expect(getCreditsLabels([oneZeroCredit], 0, true, getPhrase)).toMatchObject({
            title: 'ViewBookings.Titles.RedeemVoucher',
            description: 'ViewBookings.Labels.RedeemVoucher',
        });
    });

    it('should return gift card title, description when user has one zero credit with credit history and gift card is enabled', () => {
        expect(getCreditsLabels([{ ...oneZeroCredit, hasCreditHistory: true }], 0, true, getPhrase)).toMatchObject({
            title: 'ViewBookings.Titles.RedeemVoucher',
            description: 'ViewBookings.Labels.RedeemVoucher',
        });
    });
});
