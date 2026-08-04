import React, { FC } from 'react';

import { Tokens } from 'code/tokens';
import useStore from 'frontend/hooks/useStore';
import { TStores } from 'frontend/store/IStores';
import { Tokenizer } from 'frontend/utils/tokenizer';
import { ISitecoreField } from 'models/sitecore/generic/ISitecoreField';

export interface IAmountLeftToPayProps {
    amountLeftToPayField?: ISitecoreField<string>;
}

export const AmountLeftToPay: FC<IAmountLeftToPayProps> = ({ amountLeftToPayField }) => {
    const { amountToPay, usedCredit, formatMoney, currency } = useStore((stores: TStores) => ({
        amountToPay: stores.payStore.amountToPay,
        usedCredit: stores.payStore.usedCredit,
        currency: stores.payStore.currency,
        formatMoney: stores.marketStore.formatMoney,
    }));

    return (
        <>
            {amountLeftToPayField?.value && usedCredit > 0 && (
                <div className='pay-remaining-details'>
                    {Tokenizer.replaceToken(
                        amountLeftToPayField.value,
                        Tokens.Amount,
                        formatMoney(amountToPay, {
                            currency,
                        }),
                    )}
                </div>
            )}
        </>
    );
};

export default AmountLeftToPay;
