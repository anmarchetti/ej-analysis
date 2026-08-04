import React, { FC, Fragment } from 'react';

import { ICurrencyFormatOptions } from 'code/currency';
import useStore from 'frontend/hooks/useStore';
import { NumberFormatPartTypes } from 'frontend/store/base';

export const MIN_FRACTION_DIGITS = 2;

export type TFormattedMoneyProps = {
    amount: number;
    className?: string;
    dataTid?: string;
    options?: ICurrencyFormatOptions;
};

const FormattedMoney: FC<TFormattedMoneyProps> = ({ amount, dataTid, className, options }) => {
    const { formatMoneyToIntegerAndDecimalWithTypes } = useStore(stores => ({
        formatMoneyToIntegerAndDecimalWithTypes: stores.marketStore.formatMoneyToIntegerAndDecimalWithTypes,
    }));

    const priceParts = formatMoneyToIntegerAndDecimalWithTypes(amount, options);

    return (
        <>
            {priceParts.map(({ type, value }) =>
                type === NumberFormatPartTypes.Decimal ? (
                    <span key={type} data-tid={dataTid} className={className}>
                        {value}
                    </span>
                ) : (
                    <Fragment key={type}>{value}</Fragment>
                ),
            )}
        </>
    );
};

export default FormattedMoney;
