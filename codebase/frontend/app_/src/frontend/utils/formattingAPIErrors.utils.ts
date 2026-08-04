import { CurrencyCode, TrailingZeroDisplay } from 'code/currency';
import { MarketStore } from 'frontend/store/base';
import { Tokenizer } from 'frontend/utils/tokenizer';
import { IApiInnerError } from 'models/data/ApiErrorData';

export const getFormattedValidationErrors = (
    errors: IApiInnerError[],
    formatMoney: MarketStore['formatMoney'],
    currency: CurrencyCode | undefined,
): IApiInnerError[] =>
    errors.map(error => {
        const pricesInMessage = error.message.match(/\{\d+\.?\d+\}/g);

        if (!!pricesInMessage?.length) {
            const tokensObj = pricesInMessage.reduce((acc, price, i) => {
                const priceWithoutBrackets = price.replace(/\{|\}/g, '');
                const formattedPrice = formatMoney(Number(priceWithoutBrackets), {
                    currency,
                    trailingZeroDisplay: TrailingZeroDisplay.StripIfInteger,
                });

                return { ...acc, [`currency${i + 1}`]: formattedPrice };
            }, {});

            const errorMessageWithTokens = pricesInMessage.reduce(
                (acc, _, i) => acc.replace(/\{\d+\.?\d+\}/, `currency${i + 1}`),
                error.message,
            );

            return {
                message: Tokenizer.replaceTokens(errorMessageWithTokens, tokensObj) || error.message,
                code: error.code,
            };
        }

        return error;
    });
