import { FC } from 'react';
import classNames from 'classnames';
import { observer } from 'mobx-react';

import { Tokens } from 'code/tokens';
import useStore from 'frontend/hooks/useStore';
import { IHolidaysStores } from 'frontend/store/holidays';
import { getAmendmentRoundedPrice } from 'frontend/utils/amendBooking.utils';
import { Tokenizer } from 'frontend/utils/tokenizer';
import SitecoreDictionary from 'models/enum/SitecoreDictionary';

import styles from './AmendUpsellMessage.module.scss';

interface ITransferItemAmendLabelProps {
    price: number;
    priceLabel: SitecoreDictionary;
}

const AmendUpsellMessage: FC<ITransferItemAmendLabelProps> = ({ price, priceLabel }) => {
    const { getPhrase, formatMoney, currency, isPostBookingPages } = useStore((stores: IHolidaysStores) => ({
        getPhrase: stores.layoutStore.getPhrase,
        formatMoney: stores.marketStore.formatMoney,
        currency: stores.amendTransfersStore.currency,
        isPostBookingPages: stores.layoutStore.isPostBookingPages,
    }));

    if (!price || !priceLabel) {
        return null;
    }

    const formattedPrice = formatMoney(getAmendmentRoundedPrice(price), { currency, maximumFractionDigits: 0 });

    const upsellMessage = Tokenizer.replaceToken(getPhrase(priceLabel), Tokens.Price, formattedPrice);

    return (
        <p className={classNames(styles.label, 'align-self-md-end', { [styles.biggerMargin]: isPostBookingPages })}>
            {upsellMessage}
        </p>
    );
};

export default observer(AmendUpsellMessage);
