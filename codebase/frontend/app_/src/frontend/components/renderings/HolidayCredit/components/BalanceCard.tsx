import React, { FC } from 'react';
import { Text } from '@sitecore-jss/sitecore-jss-nextjs';
import classNames from 'classnames';

import { CurrencyCode } from 'code/currency';
import useStore from 'frontend/hooks/useStore';
import { IHolidaysStores } from 'frontend/store/holidays';
import { scrollToElement } from 'frontend/utils/ui.utils';
import { IMarketTab } from 'models/data/MyCreditInfo';
import SitecoreDictionary from 'models/enum/SitecoreDictionary';
import { ISitecoreField } from 'models/sitecore/generic/ISitecoreField';
import Button from 'frontend/components/common/Button';
import FormattedMoney, { MIN_FRACTION_DIGITS } from 'frontend/components/common/FormattedMoney/FormattedMoney';
import { Spinner } from 'frontend/components/common/Spinner';
import SvgInfoFilled from 'frontend/components/icons-new/InfoFilled';
import { QUESTION_AND_ANSWERS_ANCHOR_ID } from 'frontend/components/renderings/QuestionAndAnswer/QuestionAndAnswer';

import styles from './balanceCard.module.scss';

interface IHolidayCreditProps {
    activeCurrency: CurrencyCode | undefined;
    amount: Nullable<number>;
    changeActiveWallet: (string) => void;
    helpLinkText: string | undefined;
    isCreditLoading: boolean;
    tabs: IMarketTab[] | undefined;
    MultipleCreditsInfo?: ISitecoreField<string>;
}

const BalanceCard: FC<IHolidayCreditProps> = ({
    amount,
    isCreditLoading,
    tabs,
    activeCurrency,
    helpLinkText,
    changeActiveWallet,
    MultipleCreditsInfo,
}) => {
    const { getPhrase } = useStore((stores: IHolidaysStores) => ({
        getPhrase: stores.layoutStore.getPhrase,
    }));

    const onAnchorClick = (event: React.MouseEvent<HTMLAnchorElement, MouseEvent>): void => {
        event.preventDefault();
        const section = document.getElementById(QUESTION_AND_ANSWERS_ANCHOR_ID)?.parentElement;

        if (section) {
            scrollToElement(section);
        }
    };

    const hasMultipleCredits =
        tabs && tabs.filter(tab => tab.balance > 0 || tab.currency === activeCurrency).length > 1;

    return (
        <div className={styles.card}>
            {!!tabs?.length && tabs.length > 1 && (
                <div className={styles.tabs} data-tid='wallet-tabs'>
                    {tabs.map(tab => (
                        <Button
                            className={classNames(styles.tab, activeCurrency === tab.currency && styles.active)}
                            key={tab.currency}
                            onClick={(): void => changeActiveWallet(tab.currency)}
                            data-tid={`market-tab-${tab.currency}`}
                            disabled={activeCurrency === tab.currency}
                            aria-label={tab.screenReaderLabel?.value}
                        >
                            {tab.currency}
                        </Button>
                    ))}
                </div>
            )}
            <div className={styles.wrapper} data-cs-mask>
                <h4 className={styles.title}>{getPhrase(SitecoreDictionary.HolidayCreditTitlesBalanceCard)}</h4>
                {isCreditLoading || amount === null ? (
                    <Spinner />
                ) : (
                    <div className={styles.price} data-tid='credit-balance'>
                        <FormattedMoney
                            amount={amount ?? 0}
                            dataTid='credit-balance-pence'
                            className={styles.remainder}
                            options={{ currency: activeCurrency, minimumFractionDigits: MIN_FRACTION_DIGITS }}
                        />
                    </div>
                )}
                {helpLinkText && (
                    <div>
                        <a href={`#${QUESTION_AND_ANSWERS_ANCHOR_ID}`} className={styles.link} onClick={onAnchorClick}>
                            {helpLinkText}
                        </a>
                    </div>
                )}
                {hasMultipleCredits && (
                    <div className={styles.multipleCurrenciesInfo} data-tid='multiple-currencies-info'>
                        <SvgInfoFilled className={styles.icon} />
                        <Text field={MultipleCreditsInfo} />
                    </div>
                )}
            </div>
        </div>
    );
};

export default BalanceCard;
