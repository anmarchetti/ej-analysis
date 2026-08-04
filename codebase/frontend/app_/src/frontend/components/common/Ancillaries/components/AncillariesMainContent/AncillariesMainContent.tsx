import React, { FC } from 'react';
import { Text } from '@sitecore-jss/sitecore-jss-nextjs';
import classNames from 'classnames';

import useStore from 'frontend/hooks/useStore';
import { TStores } from 'frontend/store/IStores';
import { ISitecoreField, ISitecoreImage } from 'models/sitecore/generic/ISitecoreField';
import JSSImage from 'frontend/components/common/JSSImage';
import RichTextWithLinks from 'frontend/components/common/RichTextWithLinks';

import styles from './AncillariesMainContent.module.scss';

export type TAncillariesMainContentProps = {
    Description?: ISitecoreField<string>;
    Icon?: ISitecoreField<ISitecoreImage>;
    Subtitle?: ISitecoreField<string>;
    dataTid?: string;
};

const AncillariesMainContent: FC<TAncillariesMainContentProps> = ({ Icon, Subtitle, Description, dataTid }) => {
    const { isPostBookingPages } = useStore(({ layoutStore }: TStores) => ({
        isPostBookingPages: layoutStore.isPostBookingPages,
    }));

    return (
        <div data-tid={dataTid} className={classNames(styles.promo, { [styles.promoPostBooking]: isPostBookingPages })}>
            <JSSImage data-tid='ancillaries-icon' field={Icon} className={styles.image} />
            <div>
                <Text
                    field={Subtitle}
                    tag='div'
                    className={classNames(isPostBookingPages ? styles.altSubtitle : styles.subtitle)}
                    data-tid='ancillaries-subtitle'
                />
                {Description && (
                    <RichTextWithLinks
                        field={Description}
                        tag='div'
                        className={styles.description}
                        dataId='ancillaries-description'
                    />
                )}
            </div>
        </div>
    );
};

export default AncillariesMainContent;
