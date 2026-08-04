import { FC } from 'react';

import { ISitecoreComponent } from 'models/sitecore/generic/ISitecoreComponent';
import TabComponent, { ITab } from 'frontend/components/common/TabComponent/TabComponent';

import styles from './SEOLinksTabs.module.scss';

interface ISEOLinksTabsFields {
    items: ITab[];
}

export type TSEOLinksTabsProps = ISitecoreComponent<ISEOLinksTabsFields>;

const SEOLinksTabs: FC<TSEOLinksTabsProps> = ({ fields }) => {
    if (!fields?.items.length) {
        return null;
    }

    return (
        <div className={styles.wrapper}>
            <TabComponent data={fields.items} />
        </div>
    );
};

export default SEOLinksTabs;
