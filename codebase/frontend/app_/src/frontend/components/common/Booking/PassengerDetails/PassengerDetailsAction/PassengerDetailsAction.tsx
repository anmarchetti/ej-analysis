import { FC } from 'react';
import classNames from 'classnames';

import useStore from 'frontend/hooks/useStore';
import { IHolidaysStores } from 'frontend/store/holidays';
import SitecoreDictionary from 'models/enum/SitecoreDictionary';
import Button from 'frontend/components/common/Button';

import styles from './passengerDetailsAction.module.scss';

interface IPassengerDetailsActionProps {
    onClick: (e?: React.MouseEvent) => void;
    className?: string;
}

const PassengerDetailsAction: FC<IPassengerDetailsActionProps> = ({ onClick, className }) => {
    const { getPhrase, isDisabled } = useStore((stores: IHolidaysStores) => ({
        getPhrase: stores.layoutStore.getPhrase,
        isDisabled: stores.amendPassengerStore.isAmendCTADisabled,
    }));

    return (
        <div className={classNames('no-print', styles.action, className)} data-tid='passenger-details-action'>
            <Button isOutlined isSmall onClick={onClick} dataTid='passengers-details-entry-cta' disabled={isDisabled}>
                {getPhrase(SitecoreDictionary.AmendPassengerButtonsEditPassenger)}
            </Button>
        </div>
    );
};

export default PassengerDetailsAction;
