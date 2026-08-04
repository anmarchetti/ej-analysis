import React, { FunctionComponent } from 'react';

import { cmsUrls } from 'code/endpoints';
import { ITransfer } from 'models/data/ITransfer';
import ImageWithFilter, { SVGFilterMatrix } from 'frontend/components/common/ImageWithFilter/ImageWithFilter';
import TransferDuration from 'frontend/components/renderings/Transfer/components/TransferDuration/TransferDuration';

import styles from './TransferHeader.module.scss';

export interface ITransferHeaderProps {
    isNoTransfer: boolean;
    isShouldShowTransferDuration: boolean;
    name: string;
    iconUrl?: string;
    transferInfo?: ITransfer['transferInfo'];
}

const TransferHeader: FunctionComponent<ITransferHeaderProps> = ({
    name,
    iconUrl,
    transferInfo,
    isNoTransfer,
    isShouldShowTransferDuration,
}) => (
    <div className={styles.headerContainer}>
        {iconUrl && !isNoTransfer && (
            <div className={styles.icon}>
                <ImageWithFilter
                    imageSrc={cmsUrls.media(cmsUrls.media(iconUrl))}
                    filterMatrix={SVGFilterMatrix.Lightblack}
                    className={styles.icon}
                />
            </div>
        )}
        <div className={styles.titleContainer}>
            <div data-tid={`name-${name}`} className={styles.name}>
                {name}
            </div>
            {isShouldShowTransferDuration && (
                <TransferDuration
                    className={styles.transferDuration}
                    iconClassName={styles.transferDurationIcon}
                    duration={transferInfo?.duration as number}
                    hideOnMobile
                />
            )}
        </div>
    </div>
);

export default TransferHeader;
