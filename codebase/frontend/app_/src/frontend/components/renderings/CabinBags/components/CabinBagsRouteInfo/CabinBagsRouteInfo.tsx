import React from 'react';
import { Text } from '@sitecore-jss/sitecore-jss-nextjs';
import classNames from 'classnames';
import { observer } from 'mobx-react';

import { Tokens } from 'code/tokens';
import useStore from 'frontend/hooks/useStore';
import { TStores } from 'frontend/store/IStores';
import { Tokenizer } from 'frontend/utils/tokenizer';
import { ICabinBagsFields } from 'models/data/ICabinBagsFields';
import JSSImage from 'frontend/components/common/JSSImage';

import styles from './CabinBagsRouteInfo.module.scss';

export interface ICabinBagsRouteInfoProps {
    fields: ICabinBagsFields;
    numberOfBags: number;
    isOverheadShown?: boolean;
}

export const CabinBagsRouteInfo = ({ numberOfBags, fields, isOverheadShown }: ICabinBagsRouteInfoProps) => {
    const { infants, LCBCount } = useStore(({ guestDetailsStore, flightsPassengersStore }: TStores) => ({
        infants: guestDetailsStore.infants,
        LCBCount: flightsPassengersStore.LCBCount,
    }));

    const {
        IncludedBagsLabel,
        OverheadBagLabel,
        IncludedIcon,
        OverheadIcon,
        IncludedWithInfantLabel,
        OverheadAddedIcon,
        OverheadBagAddedLabel,
    } = fields;
    const includedLabel = Tokenizer.replaceToken(IncludedBagsLabel?.value, Tokens.Count, numberOfBags.toString());
    const includeInfantLabel = Tokenizer.replaceTokens(IncludedWithInfantLabel?.value, {
        [Tokens.Count]: numberOfBags.toString(),
        [Tokens.InfantCount]: infants.length.toString(),
    });

    const bagsAddedLabel = Tokenizer.replaceToken(OverheadBagAddedLabel?.value, Tokens.Count, LCBCount.toString());

    return (
        <div data-tid='lcb-route-info' className={styles.container}>
            <div className={styles.bagType} data-tid='lcb-bag-type'>
                <JSSImage data-tid='included-bag-icon' field={IncludedIcon} className={styles.icon} />
                {!!infants.length ? includeInfantLabel : includedLabel}
            </div>
            <div
                className={classNames(styles.bagType, (!isOverheadShown || LCBCount) && 'd-none')}
                data-tid='lcb-bag-type'
            >
                <JSSImage data-tid='overhead-bag-not-added-icon' field={OverheadIcon} className={styles.icon} />
                <Text field={OverheadBagLabel} tag='span' />
            </div>

            <div className={classNames(styles.bagType, !LCBCount && 'd-none')} data-tid='lcb-bag-type'>
                <JSSImage data-tid='overhead-bag-added-icon' field={OverheadAddedIcon} className={styles.icon} />
                {bagsAddedLabel}
            </div>
        </div>
    );
};

export default observer(CabinBagsRouteInfo);
