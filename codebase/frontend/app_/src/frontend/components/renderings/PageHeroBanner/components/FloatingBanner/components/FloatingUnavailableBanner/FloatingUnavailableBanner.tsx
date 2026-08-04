import React, { FC } from 'react';
import { observer } from 'mobx-react';

import { Tokens } from 'code/tokens';
import useStore from 'frontend/hooks/useStore';
import { TStores } from 'frontend/store/IStores';
import { Tokenizer } from 'frontend/utils/tokenizer';
import { IHeroBannerCategoryFields } from 'models/data/IHeroBanner';
import SitecoreDictionary from 'models/enum/SitecoreDictionary';

import styles from './FloatingUnavailableBanner.module.scss';

const FloatingUnavailableBanner: FC<IHeroBannerCategoryFields> = ({ PageCategory }) => {
    const { destinationParents, getPhrase, getDestinationParentBreadcrumb } = useStore((stores: TStores) => ({
        destinationParents: stores.layoutStore.destinationParents,
        getPhrase: stores.layoutStore.getPhrase,
        getDestinationParentBreadcrumb: stores.layoutStore.getDestinationParentBreadcrumb,
    }));

    const destinationParentName = destinationParents[0]?.name || '';
    const link = getDestinationParentBreadcrumb();
    const linkText = Tokenizer.replaceTokens(
        getPhrase(SitecoreDictionary.DestinationsButtonsUnavailableDestinationButton),
        {
            [Tokens.Region]: destinationParentName,
        },
    );
    const text = Tokenizer.replaceTokens(getPhrase(SitecoreDictionary.GlobalsTitlesSorryThisXIsCurrentlyUnavailable), {
        [Tokens.Resort]: PageCategory.value.toLocaleLowerCase(),
    });

    return (
        <div className={styles.banner} data-tid='unavailable-banner'>
            <p className={styles.text}>{text}</p>
            <a className={styles.link} href={link}>
                {linkText}
            </a>
        </div>
    );
};

export default observer(FloatingUnavailableBanner);
