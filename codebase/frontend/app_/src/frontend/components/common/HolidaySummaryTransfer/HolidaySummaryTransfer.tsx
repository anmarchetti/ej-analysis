import { FC } from 'react';

import { cmsUrls } from 'code/endpoints';
import { ITransfer } from 'models/data/ITransfer';
import styles from 'frontend/components/common/HolidaySummary/HolidaySummary.module.scss';
import ImageWithFilter, { SVGFilterMatrix } from 'frontend/components/common/ImageWithFilter/ImageWithFilter';

export interface IHolidaySummaryTransferProps {
    dataTid: string;
    transfer: ITransfer;
}

const HolidaySummaryTransfer: FC<IHolidaySummaryTransferProps> = ({ transfer, dataTid }) => (
    <>
        {!transfer.isHidden && (
            <div className={styles.block} data-tid={dataTid}>
                <ImageWithFilter
                    imageSrc={cmsUrls.media(transfer.iconUrl as string)}
                    filterMatrix={SVGFilterMatrix.Grayscale}
                    className={styles.icon}
                    dataTid={`${dataTid}-icon`}
                />
                <div className={styles.title} data-tid={`${dataTid}-name`}>
                    {transfer.name}
                </div>
            </div>
        )}
    </>
);

export default HolidaySummaryTransfer;
