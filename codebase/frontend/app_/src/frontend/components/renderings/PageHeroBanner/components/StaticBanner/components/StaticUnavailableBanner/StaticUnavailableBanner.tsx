import React, { FC } from 'react';
import { observer } from 'mobx-react';

import { Tokens } from 'code/tokens';
import useStore from 'frontend/hooks/useStore';
import { TStores } from 'frontend/store/IStores';
import { Tokenizer } from 'frontend/utils/tokenizer';
import { IHeroBannerHeadingFields } from 'models/data/IHeroBanner';
import SitecoreDictionary from 'models/enum/SitecoreDictionary';
import SvgWarningFilled from 'frontend/components/icons-new/WarningFilled';

import styles from './StaticUnavailableBanner.module.scss';

const StaticUnavailableBanner: FC<IHeroBannerHeadingFields> = ({ Title, Name }) => {
    const { getPhrase, destinationParents, getDestinationParentBreadcrumb } = useStore((stores: TStores) => ({
        getPhrase: stores.layoutStore.getPhrase,
        destinationParents: stores.layoutStore.destinationParents,
        getDestinationParentBreadcrumb: stores.layoutStore.getDestinationParentBreadcrumb,
    }));

    const destinationParentName = destinationParents[0]?.name || '';

    const text = Tokenizer.replaceTokens(
        getPhrase(SitecoreDictionary.DestinationsLabelsHeroBannerUnavailableDestinationBanner),
        {
            [Tokens.Region]: destinationParentName,
            [Tokens.Resort]: Title?.value || Name?.value || '',
        },
    );
    const linkText = Tokenizer.replaceTokens(
        getPhrase(SitecoreDictionary.DestinationsButtonsUnavailableDestinationBannerLink),
        {
            [Tokens.Region]: destinationParentName,
        },
    );
    const link = getDestinationParentBreadcrumb();

    return (
        <div data-tid='unavailable-banner' className={styles.wrapper}>
            <p className={styles.text}>
                <SvgWarningFilled />
                {text}
            </p>
            <a href={link} className={styles.button}>
                {linkText}
            </a>
        </div>
    );
};

export default observer(StaticUnavailableBanner);
