import React, { useEffect, useState } from 'react';
import { Placeholder } from '@sitecore-jss/sitecore-jss-nextjs';
import classNames from 'classnames';
import { observer } from 'mobx-react';

import { CurrencyCode } from 'code/currency';
import useStore from 'frontend/hooks/useStore';
import { IHolidaysStores } from 'frontend/store/holidays';
import { IHolidayCreditFields, IMarketTab } from 'models/data/MyCreditInfo';
import { PlaceholderNames } from 'models/enum/PlaceholderNames';
import { ISitecoreComponent } from 'models/sitecore/generic/ISitecoreComponent';
import OverlaySpinner from 'frontend/components/common/OverlaySpinner';
import RefundSuccessPopup from 'frontend/components/renderings/CreditConfirm/components/RefundSuccessPopup';

import BalanceCard from './components/BalanceCard';
import { getCreditTabs } from './utils';

import styles from './holidayCredit.module.scss';

export type THolidayCreditProps = ISitecoreComponent<IHolidayCreditFields>;

const HolidayCredit: React.FC<THolidayCreditProps> = ({ fields, rendering }) => {
    const {
        currency,
        creditBalance,
        isCreditLoading,
        isRefundSuccessPopupShown,
        isLoggedIn,
        initialize,
        clearRecentRefund,
        setLatestRedeemedVoucherCode,
    } = useStore((stores: IHolidaysStores) => ({
        currency: stores.marketStore.currency,
        creditBalance: stores.holidayCreditStore.creditBalance,
        isCreditLoading: stores.holidayCreditStore.isCreditLoading,
        isRefundSuccessPopupShown: stores.holidayCreditStore.isRefundSuccessPopupShown,
        isLoggedIn: stores.userStore.isLoggedIn,
        initialize: stores.holidayCreditStore.initialize,
        clearRecentRefund: stores.holidayCreditStore.clearRecentRefund,
        setLatestRedeemedVoucherCode: stores.redeemVoucherStore.setLatestRedeemedVoucherCode,
    }));

    useEffect(() => {
        initialize();

        return () => {
            clearRecentRefund();
            setLatestRedeemedVoucherCode(null);
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const [activeWallet, setActiveWallet] = useState<IMarketTab>();
    const [availableTabs, setAvailableTabs] = useState<IMarketTab[]>([]);

    useEffect(() => {
        if (!creditBalance?.length) {
            return;
        }

        const tabs = getCreditTabs(fields?.MarketCredits, creditBalance, currency);

        setAvailableTabs(tabs);
        setActiveWallet(tabs[0]);
    }, [creditBalance, currency, fields?.MarketCredits]);

    const changeActiveWallet = (newCurrency: CurrencyCode): void => {
        const newWallet = availableTabs?.find(item => item.currency === newCurrency);
        setActiveWallet(newWallet);
    };

    if (!isLoggedIn) {
        return <OverlaySpinner header={fields?.LoadingCreditHistoryLabel.value} />;
    }

    return (
        <div className={styles.block}>
            <Placeholder name={PlaceholderNames.CreditPageTitle} rendering={rendering} />
            <Placeholder
                name={PlaceholderNames.CreditExpiresBanner}
                rendering={rendering}
                className={styles.bannerPaddings}
            />

            {isRefundSuccessPopupShown && <RefundSuccessPopup />}

            <div className={styles.row}>
                {availableTabs.length > 1 && fields?.InfoText?.value && (
                    <p data-tid='credit-warning' className={classNames(styles.rowFull, styles.text)}>
                        {fields?.InfoText?.value}
                    </p>
                )}
                <div className={classNames(styles.rowHalf, styles.balanceCardWrapper)} data-cs-mask>
                    <BalanceCard
                        amount={activeWallet?.balance}
                        isCreditLoading={isCreditLoading || creditBalance === null}
                        tabs={availableTabs}
                        activeCurrency={activeWallet?.currency}
                        changeActiveWallet={changeActiveWallet}
                        helpLinkText={fields?.HelpLink?.value?.text}
                        MultipleCreditsInfo={fields?.MultipleCreditsInfo}
                    />
                </div>
                <div className={classNames(styles.rowFull, styles.history)} data-cs-mask>
                    <Placeholder
                        name={PlaceholderNames.CreditBalanceHistory}
                        rendering={rendering}
                        activeCurrency={activeWallet?.currency}
                    />
                </div>
                <div className={classNames(styles.rowHalf, styles.carousel)}>
                    <Placeholder name={PlaceholderNames.CreditLinksCard} rendering={rendering} />
                </div>
            </div>
        </div>
    );
};

export default observer(HolidayCredit);
