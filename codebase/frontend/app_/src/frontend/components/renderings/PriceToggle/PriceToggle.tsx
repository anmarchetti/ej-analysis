import React, { useEffect } from 'react';
import { Text } from '@sitecore-jss/sitecore-jss-nextjs';
import classNames from 'classnames';
import { observer } from 'mobx-react';

import useStore from 'frontend/hooks/useStore';
import { ITradePortalStores } from 'frontend/store/tradePortal';
import { isSitecoreCheckboxSelected } from 'frontend/utils/sitecore.utils';
import { getWebStorageItem } from 'frontend/utils/webStorage.utils';
import { WebStorageKeys } from 'models/enum/WebStorageKeys';
import { ISitecoreComponent } from 'models/sitecore/generic/ISitecoreComponent';
import { ISitecoreField, ISitecoreImage } from 'models/sitecore/generic/ISitecoreField';
import { TSitecoreCheckboxValue } from 'models/sitecore/generic/SitecoreCheckboxValue';
import Checkbox from 'frontend/components/common/Checkbox';
import JSSImage from 'frontend/components/common/JSSImage';
import SvgArrow from 'frontend/components/icons-new/Arrow';

import styles from './PriceToggle.module.scss';

interface IPriceToggleFields {
    Icon: ISitecoreField<ISitecoreImage>;
    LabelOff: ISitecoreField<string>;
    LabelOn: ISitecoreField<string>;
    Title: ISitecoreField<string>;
}

interface IPriceToggleParams {
    IsCollapsed?: TSitecoreCheckboxValue;
    IsPricesHidden?: TSitecoreCheckboxValue;
}

type TPriceToggleProps = ISitecoreComponent<IPriceToggleFields, IPriceToggleParams>;

const PriceToggle = ({ fields, params }: TPriceToggleProps) => {
    const {
        isPricesHidden,
        setPriceToggleActive,
        onChangePriceToggle,
        isPriceToggleCollapsed,
        setPriceToggleCollapsed,
        onChangePriceToggleCollapsed,
        isPriceToggleHidden,
    } = useStore(({ layoutStore }: ITradePortalStores) => ({
        isPricesHidden: layoutStore.isPricesHidden,
        isPriceToggleHidden: layoutStore.isPriceToggleHidden,
        setPriceToggleActive: layoutStore.setPriceToggleActive,
        onChangePriceToggle: layoutStore.onChangePriceToggle,
        isPriceToggleCollapsed: layoutStore.isPriceToggleCollapsed,
        setPriceToggleCollapsed: layoutStore.setPriceToggleCollapsed,
        onChangePriceToggleCollapsed: layoutStore.onChangePriceToggleCollapsed,
    }));

    useEffect(() => {
        const storageSettings = getWebStorageItem(WebStorageKeys.PriceToggleSettings, true) || {};

        // storage settings more important then sitecore
        if (storageSettings.isPricesHidden !== undefined) {
            setPriceToggleActive(storageSettings.isPricesHidden);
        } else {
            setPriceToggleActive(isSitecoreCheckboxSelected(params.IsPricesHidden));
        }

        // storage settings more important then sitecore
        if (storageSettings.isCollapsed !== undefined) {
            setPriceToggleCollapsed(storageSettings.isCollapsed);
        } else {
            setPriceToggleCollapsed(isSitecoreCheckboxSelected(params.IsCollapsed));
        }
    }, [setPriceToggleActive, setPriceToggleCollapsed, params]);

    if (!fields || isPriceToggleHidden) {
        return null;
    }

    const { Title, LabelOn, LabelOff, Icon } = fields;

    return (
        <section
            className={classNames(styles.priceToggle, isPriceToggleCollapsed && styles.collapsed)}
            data-tid='price-toggle'
        >
            <div className={styles.control} onClick={onChangePriceToggleCollapsed} data-tid='price-toggle-control'>
                <SvgArrow className={styles.arrow} />
            </div>
            <div className={styles.wrapper}>
                {Title && <Text tag='h4' className={styles.title} field={Title} data-tid='price-toggle-title' />}
                <div className={styles.toggle}>
                    <Checkbox toggle isGreyTheme onChange={onChangePriceToggle} checked={isPricesHidden} />
                </div>
                <div className={styles.description} data-tid='price-toggle-description'>
                    <JSSImage field={Icon} className={styles.icon} />
                    <span className={styles.label} data-tid='price-toggle-label'>
                        {isPricesHidden ? LabelOff.value : LabelOn.value}
                    </span>
                </div>
            </div>
        </section>
    );
};

export default observer(PriceToggle);
