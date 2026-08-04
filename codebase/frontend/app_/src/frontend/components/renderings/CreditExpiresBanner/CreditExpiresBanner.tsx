import React, { FC, useEffect, useMemo } from 'react';
import { Text } from '@sitecore-jss/sitecore-jss-nextjs';
import classNames from 'classnames';
import { observer } from 'mobx-react';

import { useMobileViewport } from 'frontend/hooks/useMediaQuery';
import useStore from 'frontend/hooks/useStore';
import { IHolidaysStores } from 'frontend/store/holidays';
import { ISitecoreComponent } from 'models/sitecore/generic/ISitecoreComponent';
import ExpandableItem from 'frontend/components/common/ExpandableItem/ExpandableItem';
import JSSImage from 'frontend/components/common/JSSImage';
import Link from 'frontend/components/common/Link';
import RichTextWithLinks from 'frontend/components/common/RichTextWithLinks';

import { getSitecoreContent } from './utils/utils';
import { ICreditExpiresBannerFields } from './interfaces';

import styles from './CreditExpiresBanner.module.scss';

export interface ICreditExpiresBannerProps extends ISitecoreComponent<ICreditExpiresBannerFields> {
    className?: string;
}

export const CreditExpiresBanner: FC<ICreditExpiresBannerProps> = ({ fields, className }) => {
    const {
        balanceHistory,
        currency,
        showCreditExpiresSoonBannerWithinDays,
        fetchBalanceHistory,
        clearStore,
        isHolidayCreditPage,
        formatMoney,
    } = useStore((stores: IHolidaysStores) => ({
        balanceHistory: stores.holidayCreditStore.balanceHistory,
        currency: stores.marketStore.currency,
        showCreditExpiresSoonBannerWithinDays: stores.holidayCreditStore.showCreditExpiresSoonBannerWithinDays,
        fetchBalanceHistory: stores.holidayCreditStore.fetchBalanceHistory,
        clearStore: stores.holidayCreditStore.clearStore,
        isHolidayCreditPage: stores.layoutStore.isHolidayCreditPage,
        formatMoney: stores.marketStore.formatMoney,
    }));
    const isMobile = useMobileViewport();

    useEffect(() => {
        if (!isHolidayCreditPage) {
            fetchBalanceHistory();
        }

        return () => {
            if (!isHolidayCreditPage) {
                clearStore();
            }
        };
    }, [isHolidayCreditPage]);

    const bannerContentByType = useMemo(() => {
        if (!fields || !balanceHistory || Object.keys(balanceHistory).length === 0) {
            return undefined;
        }

        const content = getSitecoreContent(
            fields.Children,
            balanceHistory,
            currency,
            showCreditExpiresSoonBannerWithinDays,
            formatMoney,
        );

        return content;
    }, [fields, balanceHistory, currency, showCreditExpiresSoonBannerWithinDays, formatMoney]);

    if (!fields || !balanceHistory || !bannerContentByType) {
        return null;
    }

    const { BookHolidayCTA, Icon } = fields;
    const { Subtitle, Title } = bannerContentByType;

    const buttonEl = BookHolidayCTA?.value?.href ? (
        <Link
            href={BookHolidayCTA.value?.href}
            target={BookHolidayCTA.value?.target}
            data-tid='book-holiday-cta'
            className={styles.cta}
        >
            {BookHolidayCTA.value?.text}
        </Link>
    ) : null;

    if (isMobile) {
        return (
            <div data-tid='credit-expires-banner' className={classNames(styles.creditBanner, className)}>
                <ExpandableItem
                    dataTid='expandable-banner'
                    className={styles.expandable}
                    titleWrapperClassName={styles.titleWrapper}
                    title={Title.value}
                    titleClassName={styles.title}
                    icon={<JSSImage field={Icon} className={styles.icon} data-tid='banner-icon' />}
                    expandArrowClassName={styles.expandArrow}
                >
                    <div className={styles.textContainer}>
                        <RichTextWithLinks field={Subtitle} className={styles.text} dataId='banner-text' />
                    </div>
                </ExpandableItem>
                {buttonEl}
            </div>
        );
    }

    return (
        <div data-tid='credit-expires-banner' className={classNames(styles.creditBanner, className)}>
            <JSSImage field={Icon} className={styles.icon} data-tid='banner-icon' />
            <div className={styles.mainContainer}>
                <div className={styles.textContainer}>
                    <Text field={Title} tag='h3' className={styles.title} data-tid='banner-title' />
                    <RichTextWithLinks field={Subtitle} className={styles.text} dataId='banner-text' />
                </div>
                {buttonEl}
            </div>
        </div>
    );
};

export default observer(CreditExpiresBanner);
