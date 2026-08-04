import { DATE_FORMATS } from 'code/dates';
import { Tokens } from 'code/tokens';
import { formatDateL10n } from 'frontend/utils/date.utils';
import { Tokenizer } from 'frontend/utils/tokenizer';
import SitecoreDictionary from 'models/enum/SitecoreDictionary';

export const getRemainingBalanceTitle = (remainingDays: number, getPhrase: (key: string) => string): string => {
    let phrase;

    if (remainingDays < 0) {
        phrase = getPhrase(SitecoreDictionary.BookingHeaderLabelsRemainingBalanceOverdue);
    } else if (remainingDays === 0) {
        phrase = getPhrase(SitecoreDictionary.BookingHeaderLabelsRemainingBalanceDueToday);
    } else if (remainingDays === 1) {
        phrase = getPhrase(SitecoreDictionary.BookingHeaderLabelsRemainingBalanceDueTomorrow);
    } else {
        phrase = getPhrase(SitecoreDictionary.BookingHeaderLabelsRemainingBalanceDueDate);
    }

    return Tokenizer.replaceTokens(phrase, { [Tokens.Day]: `${remainingDays}` });
};

export const getRemainingBalanceDescription = (
    remainingDays: number,
    validBalanceDueDate: string,
    getPhrase: (key: string) => string,
    balanceDueLabel: string,
    destination?: string,
    price?: string,
): string => {
    const phrase =
        remainingDays < 0 ? getPhrase(SitecoreDictionary.BookingHeaderLabelsRemainingBalanceWasDue) : balanceDueLabel;

    return Tokenizer.replaceTokens(phrase, {
        [Tokens.Amount]: price || '',
        [Tokens.Destination]: destination || '',
        [Tokens.Date]: formatDateL10n(validBalanceDueDate, DATE_FORMATS.ordinalDateWithAbbrMonthName),
    });
};

export const getRemainingBalanceButtonDescription = (
    remainingDays: number,
    validBalanceDueDate: string,
    getPhrase: (key: string) => string,
): string => {
    const phrase =
        remainingDays < 0
            ? getPhrase(SitecoreDictionary.BookingPaymentLabelsPayRemainingBalanceOverdue)
            : getPhrase(SitecoreDictionary.BookingPaymentLabelsPayRemainingBalanceByDate);

    return Tokenizer.replaceToken(
        phrase,
        Tokens.Date,
        formatDateL10n(validBalanceDueDate, DATE_FORMATS.ordinalDateWithAbbrMonthName),
    );
};
