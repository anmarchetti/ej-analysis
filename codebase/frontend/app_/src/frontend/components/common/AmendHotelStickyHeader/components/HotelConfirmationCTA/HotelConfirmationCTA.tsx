import { FunctionComponent } from 'react';
import classNames from 'classnames';

import useStore from 'frontend/hooks/useStore';
import { IHolidaysStores } from 'frontend/store/holidays';
import SitecoreDictionary from 'models/enum/SitecoreDictionary';
import Button from 'frontend/components/common/Button';

import styles from './HotelConfirmationCTA.module.scss';

export interface IHotelConfirmationCTAProps {
    dataTid: string;
    className?: string;
}

const HotelConfirmationCTA: FunctionComponent<IHotelConfirmationCTAProps> = ({ className, dataTid }) => {
    const { getPhrase, confirmChosenHotel } = useStore((stores: IHolidaysStores) => ({
        getPhrase: stores.layoutStore.getPhrase,
        confirmChosenHotel: stores.amendHotelStore.confirmChosenHotel,
    }));

    return (
        <Button className={classNames(styles.button, className)} dataTid={dataTid} onClick={confirmChosenHotel}>
            {getPhrase(SitecoreDictionary.GlobalsButtonsContinue)}
        </Button>
    );
};

export default HotelConfirmationCTA;
