import { FunctionComponent } from 'react';

import { cmsUrls } from 'code/endpoints';
import { ITransfer } from 'models/data/ITransfer';

import styles from './TransfersBasket.module.scss';

const TransfersBasket: FunctionComponent<{ transfer: ITransfer | undefined }> = ({ transfer }) => {
    if (!transfer) return null;

    return (
        <div className='amendment-basket__transfer'>
            {transfer?.iconUrl && (
                <div className='card__icon' style={{ backgroundImage: `url("${cmsUrls.media(transfer.iconUrl)}")` }} />
            )}
            <p className={styles.transferInfo}>{transfer?.name}</p>
        </div>
    );
};
export default TransfersBasket;
