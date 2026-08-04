import { FC, useEffect } from 'react';
import classNames from 'classnames';
import { observer } from 'mobx-react';

import { Tokens } from 'code/tokens';
import useStore from 'frontend/hooks/useStore';
import { IHolidaysStores } from 'frontend/store/holidays';
import { Tokenizer } from 'frontend/utils/tokenizer';
import { IPaymentPageFields } from 'frontend/components/renderings/AmendPayment/interfaces';

import AmendmentPayNowPrices from './AmendmentPayNowPrices/AmendmentPayNowPrices';
import AmendPayNowHeader from './AmendPayNowHeader/AmendPayNowHeader';

import styles from './AmendmentPayNow.module.scss';

interface IAmendmentPayNowProps {
    fields: IPaymentPageFields;
}

const AmendmentPayNow: FC<IAmendmentPayNowProps> = ({ fields }) => {
    const { totalPrice, balanceAmount, setAmount, booking } = useStore((stores: IHolidaysStores) => ({
        setAmount: stores.payStore.setAmount,
        balanceAmount: stores.amendPaymentStore.balanceAmount,
        totalPrice: stores.amendPaymentStore.totalPrice,
        booking: stores.amendPaymentStore.booking,
    }));

    useEffect(() => {
        const priceNeedToPay = balanceAmount + totalPrice;

        if (priceNeedToPay) {
            setAmount(priceNeedToPay);
        }
    }, [balanceAmount, setAmount, totalPrice]);

    const title = balanceAmount
        ? fields?.DueBalanceLessBlockDaysTitle?.value
        : fields?.PaidBalanceLessBlockDaysTitle?.value;

    const description = Tokenizer.replaceTokens(
        balanceAmount
            ? fields?.DueBalanceLessBlockDaysDescription?.value
            : fields?.PaidBalanceLessBlockDaysDescription?.value,
        {
            [Tokens.Amount]: String(booking?.paymentInfo.allowPayOutstandingBalanceDays ?? ''),
        },
    );

    return (
        <>
            <AmendPayNowHeader
                title={title ?? ''}
                description={description}
                className={classNames({
                    [styles.hasBalanceHeader]: balanceAmount,
                    [styles.noBalanceHeader]: !balanceAmount,
                })}
                withIcon={!!balanceAmount}
            />
            {!!balanceAmount && <AmendmentPayNowPrices fields={fields} />}
        </>
    );
};

export default observer(AmendmentPayNow);
