import React, { FC } from 'react';
import classNames from 'classnames';

import { ISitecoreField, ISitecoreImage } from 'models/sitecore/generic/ISitecoreField';
import JSSImage from 'frontend/components/common/JSSImage';

import styles from './CreditItemInfo.module.scss';

export type TCreditItemInfoProps = {
    creditTypeName: string;
    dataTid: string;
    description: string;
    showLogo: boolean;
    isRecentCredit?: boolean;
    logo?: ISitecoreField<ISitecoreImage>;
};

const CreditItemInfo: FC<TCreditItemInfoProps> = ({
    logo,
    showLogo,
    creditTypeName,
    description,
    dataTid,
    isRecentCredit,
}) => (
    <div
        className={classNames(styles.creditItemInfo, {
            [styles.recentCredit]: isRecentCredit,
        })}
        data-tid={`${dataTid}-credit-info-container`}
    >
        {showLogo &&
            (logo?.value?.src ? (
                <JSSImage className={styles.logo} field={logo} dataTid={`${dataTid}-icon`} />
            ) : (
                <div data-tid={`${dataTid}-no-icon`} />
            ))}
        <div className={styles.infoContainer}>
            <span className={styles.type} data-tid={`${dataTid}-credit-type`}>
                {creditTypeName}
            </span>
            {!!description && (
                <span className={styles.description} data-tid={`${dataTid}-description`}>
                    {description}
                </span>
            )}
        </div>
    </div>
);

export default CreditItemInfo;
