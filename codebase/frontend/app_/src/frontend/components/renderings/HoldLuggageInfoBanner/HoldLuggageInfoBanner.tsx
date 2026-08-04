import React, { FC } from 'react';
import classNames from 'classnames';
import { observer } from 'mobx-react';

import useStore from 'frontend/hooks/useStore';
import { TStores } from 'frontend/store/IStores';
import { ISitecoreChildren } from 'models/data/ISitecoreChildren';
import { ISitecoreComponent } from 'models/sitecore/generic/ISitecoreComponent';
import { ISitecoreField, ISitecoreImage, ISitecoreLink } from 'models/sitecore/generic/ISitecoreField';
import InfoBlock from 'frontend/components/common/InfoBlock/InfoBlock';

import styles from './HoldLuggageInfoBanner.module.scss';

const LUXURY = 'luxury';

interface IHoldLuggageInfoBannerItemFields {
    Description: ISitecoreField<string>;
    Icon: ISitecoreField<ISitecoreImage>;
    Key: ISitecoreField<string>;
    Link: ISitecoreField<ISitecoreLink>;
    Title: ISitecoreField<string>;
}

interface IHoldLuggageInfoBannerFields {
    items: ISitecoreChildren<IHoldLuggageInfoBannerItemFields>[];
}

export type THoldLuggageInfoBannerProps = ISitecoreComponent<IHoldLuggageInfoBannerFields>;

const HoldLuggageInfoBanner: FC<THoldLuggageInfoBannerProps> = ({ fields }) => {
    const { isConfirmationPage, isLuxuryPackage } = useStore((stores: TStores) => ({
        isConfirmationPage: stores.layoutStore.isConfirmationPage,
        isLuxuryPackage: stores.bookingStore.isLuxuryPackage,
    }));

    if (!fields?.items?.length) {
        return null;
    }

    const content = fields.items.find(item => item.fields.Key.value === (isLuxuryPackage ? LUXURY : ''));

    if (!content?.fields) {
        return null;
    }

    const { Title, Description, Icon, Link } = content.fields;

    return (
        <div className={styles.holdLuggageInfoBanner}>
            <InfoBlock
                title={Title}
                text={Description}
                icon={Icon}
                link={Link}
                className={styles.infoBlock}
                btnClass={classNames(styles.button, isConfirmationPage && styles.confirmationButton)}
            />
        </div>
    );
};

export default observer(HoldLuggageInfoBanner);
