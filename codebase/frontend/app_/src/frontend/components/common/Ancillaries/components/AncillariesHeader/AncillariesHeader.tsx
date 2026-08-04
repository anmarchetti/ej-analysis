import React from 'react';
import { Text } from '@sitecore-jss/sitecore-jss-nextjs';
import classNames from 'classnames';

import useStore from 'frontend/hooks/useStore';
import { TStores } from 'frontend/store/IStores';
import { ISitecoreField } from 'models/sitecore/generic/ISitecoreField';

import styles from './AncillariesHeader.module.scss';

export type TAncillariesHeaderProps = {
    children?: React.ReactNode;
    className?: string;
    dataTid?: string;
    description?: ISitecoreField<string>;
    title?: ISitecoreField<string>;
};

const AncillariesHeader: React.FC<TAncillariesHeaderProps> = ({ title, description, dataTid, children, className }) => {
    const { isPostBookingPages } = useStore(({ layoutStore }: TStores) => ({
        isPostBookingPages: layoutStore.isPostBookingPages,
    }));

    return (
        <div
            className={classNames(styles.head, className, isPostBookingPages && styles.headPostBooking)}
            data-tid={dataTid}
        >
            <Text field={title} tag='h2' className={styles.title} data-tid={dataTid ? `${dataTid}-title` : 'title'} />
            <Text field={description} tag='span' data-tid={`${dataTid}-subtitle`} />
            {children}
        </div>
    );
};

export default AncillariesHeader;
