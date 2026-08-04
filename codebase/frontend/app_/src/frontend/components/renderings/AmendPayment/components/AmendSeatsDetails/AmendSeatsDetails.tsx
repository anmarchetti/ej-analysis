import { FunctionComponent } from 'react';
import { Placeholder } from '@sitecore-jss/sitecore-jss-nextjs';
import { observer } from 'mobx-react';

import useStore from 'frontend/hooks/useStore';
import { PlaceholderNames } from 'models/enum/PlaceholderNames';
import { ISitecoreComponent } from 'models/sitecore/generic/ISitecoreComponent';

import styles from './AmendSeatsDetails.module.scss';

interface IAmendSeatsDetailsProps {
    rendering: ISitecoreComponent['rendering'];
}

const AmendSeatsDetails: FunctionComponent<IAmendSeatsDetailsProps> = ({ rendering }) => {
    const { booking } = useStore(stores => ({
        booking: stores.amendPaymentStore.booking,
    }));

    return (
        <div className={styles.container}>
            <Placeholder name={PlaceholderNames.SeatsAndBags} rendering={rendering} isNewSelection booking={booking} />
        </div>
    );
};

export default observer(AmendSeatsDetails);
