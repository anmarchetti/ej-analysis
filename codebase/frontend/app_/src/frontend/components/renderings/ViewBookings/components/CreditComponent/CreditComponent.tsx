import React, { FC, useMemo } from 'react';
import { Text } from '@sitecore-jss/sitecore-jss-nextjs';
import classnames from 'classnames';
import { observer } from 'mobx-react';

import useStore from 'frontend/hooks/useStore';
import { IHolidaysStores } from 'frontend/store/holidays';
import SitecoreDictionary from 'models/enum/SitecoreDictionary';
import SitePath from 'models/enum/SitePath';
import { ISitecoreField } from 'models/sitecore/generic/ISitecoreField';
import Link from 'frontend/components/common/Link';
import IconChevronRight from 'frontend/components/icons/ChevronRight';
import SvgInfoFilled from 'frontend/components/icons-new/InfoFilled';
import SVGWarningFilled from 'frontend/components/icons-new/WarningFilled';

import { getCreditsLabels } from './utils';

import ViewBookingsStyles from './../../ViewBookings.module.scss';
import styles from './CreditComponent.module.scss';

export interface ICreditComponentProps {
    MultipleCreditsInfo?: ISitecoreField<string>;
}

const CreditComponent: FC<ICreditComponentProps> = ({ MultipleCreditsInfo }) => {
    const {
        creditBalance,
        marketCredit,
        isGiftCardRedemptionEnabled,
        getPhrase,
        isCreditEnabledApiSettings,
        redirectToHolidayCreditPage,
        formatMoney,
    } = useStore((stores: IHolidaysStores) => ({
        redirectToHolidayCreditPage: stores.routerStore.redirectToHolidayCreditPage,
        getPhrase: stores.layoutStore.getPhrase,
        redirectToHolidayCredit: stores.routerStore.redirectToHolidayCreditPage,
        isCreditEnabledApiSettings: stores.holidayCreditStore.isCreditEnabledApiSettings,
        isGiftCardRedemptionEnabled: stores.layoutStore.isGiftCardRedemptionEnabled,
        creditBalance: stores.holidayCreditStore.creditBalance,
        marketCredit: stores.holidayCreditStore.marketCredit,
        formatMoney: stores.marketStore.formatMoney,
    }));

    const { title, description, creditButtonText, creditAmount, showMultipleCurrenciesInfo } = useMemo(
        () => getCreditsLabels(creditBalance, marketCredit?.balance || 0, isGiftCardRedemptionEnabled, getPhrase),
        // don't use getPhrase as dependency
        // eslint-disable-next-line react-hooks/exhaustive-deps
        [creditBalance, marketCredit?.balance, isGiftCardRedemptionEnabled],
    );

    return (
        <div data-tid='view-credits-card' className={classnames(ViewBookingsStyles.item, styles.creditButton)}>
            {isCreditEnabledApiSettings ? (
                <>
                    <h4 className={ViewBookingsStyles.itemTitle}>
                        {title}
                        <IconChevronRight />
                    </h4>
                    <div className={ViewBookingsStyles.itemDescription}>{description}</div>
                    <div className={styles.wrapper}>
                        {!!creditAmount && (
                            <div className={styles.creditAmountWrapper} data-tid='credit-amount'>
                                <span className={styles.creditDescription}>
                                    {getPhrase(SitecoreDictionary.ViewBookingsLabelsYourCredit)}
                                </span>
                                <span className={styles.creditAmount}>
                                    {formatMoney(creditAmount, { currency: marketCredit?.currency })}
                                </span>
                            </div>
                        )}
                        {showMultipleCurrenciesInfo && (
                            <div className={styles.multipleCurrenciesInfo} data-tid='multiple-currencies-info'>
                                <SvgInfoFilled className={styles.icon} />
                                <Text field={MultipleCreditsInfo} />
                            </div>
                        )}
                        <div className={styles.cardFooter}>
                            <div className={styles.buttonsWrapper}>
                                {isGiftCardRedemptionEnabled && (
                                    <Link href={SitePath.RedeemVoucher} legacyBehavior>
                                        <a
                                            className={classnames(ViewBookingsStyles.itemButton, styles.button)}
                                            data-tid='redeem-voucher-btn'
                                        >
                                            {getPhrase(SitecoreDictionary.ViewBookingsButtonsRedeemVoucher)}
                                        </a>
                                    </Link>
                                )}
                                {!!creditButtonText && (
                                    <Link href={SitePath.HolidayCredit} legacyBehavior>
                                        <a
                                            className={classnames(ViewBookingsStyles.itemButton, styles.button)}
                                            onClick={redirectToHolidayCreditPage}
                                            data-tid='view-credit-button'
                                        >
                                            {creditButtonText}
                                        </a>
                                    </Link>
                                )}
                            </div>
                        </div>
                    </div>
                </>
            ) : (
                <div className={styles.viewCreditError}>
                    <SVGWarningFilled />
                    <span>{getPhrase(SitecoreDictionary.HolidayCreditErrorMessagesCreditIsDisabled)}</span>
                </div>
            )}
        </div>
    );
};

export default observer(CreditComponent);
