import React, { FC } from 'react';

import { CurrencyCode } from 'code/currency';
import { DATE_FORMATS } from 'code/dates';
import { Tokens } from 'code/tokens';
import useStore from 'frontend/hooks/useStore';
import { TStores } from 'frontend/store/IStores';
import { formatDateL10n } from 'frontend/utils/date.utils';
import { Tokenizer } from 'frontend/utils/tokenizer';
import SitecoreDictionary from 'models/enum/SitecoreDictionary';
import PricePill from 'frontend/components/common/Pills/PricePill/PricePill';

interface IRemainingBalancePillProps {
    currency: CurrencyCode | undefined;
    dueDate: string;
    value: number;
    className?: string;
}

const RemainingBalancePill: FC<IRemainingBalancePillProps> = ({ value, dueDate, currency, className }) => {
    const { getPhrase, formatMoney } = useStore((stores: TStores) => ({
        getPhrase: stores.layoutStore.getPhrase,
        formatMoney: stores.marketStore.formatMoney,
    }));

    return (
        <PricePill isLightRed isFullWidth className={className}>
            {Tokenizer.replaceTokens(getPhrase(SitecoreDictionary.ViewBookingsLabelsRemainingDueDate), {
                [Tokens.Amount]: formatMoney(value, { currency }),
                [Tokens.Date]: formatDateL10n(dueDate, DATE_FORMATS.L),
            })}
        </PricePill>
    );
};

export default RemainingBalancePill;
