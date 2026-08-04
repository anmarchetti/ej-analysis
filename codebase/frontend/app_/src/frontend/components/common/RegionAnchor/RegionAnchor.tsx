import React from 'react';
import { observer } from 'mobx-react';

import { Tokens } from 'code/tokens';
import useStore from 'frontend/hooks/useStore';
import { TStores } from 'frontend/store/IStores';
import { Tokenizer } from 'frontend/utils/tokenizer';
import { ISitecoreField, ISitecoreLink } from 'models/sitecore/generic/ISitecoreField';
import RouterLink from 'frontend/components/common/RouterLink';
import SvgChevronRight from 'frontend/components/icons-new/ChevronRight';

import styles from './RegionAnchor.module.scss';

export interface ICTAprops {
    Link: ISitecoreField<ISitecoreLink>;
    className?: string;
}

const RegionAnchor = ({ Link, className }: ICTAprops) => {
    const { location } = useStore((stores: TStores) => ({
        location: stores.layoutStore.pageName,
    }));

    if (!Link.value?.text || !Link.value?.href) return null;

    const buttonText = Tokenizer.replaceToken(Link.value.text, Tokens.Region, location);

    return (
        <RouterLink link={Link} className={`btn btn--outlined ${styles.button} ${className}`}>
            {buttonText}
            <SvgChevronRight className={styles.icon} />
        </RouterLink>
    );
};

export default observer(RegionAnchor);
