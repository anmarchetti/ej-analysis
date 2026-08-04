import { FunctionComponent } from 'react';
import { Text } from '@sitecore-jss/sitecore-jss-nextjs';
import classNames from 'classnames';

import useStore from 'frontend/hooks/useStore';
import { TStores } from 'frontend/store/IStores';
import { getHoldItemsLabel } from 'frontend/utils/luggage.utils';
import { IBookingInfo } from 'models/data/IBookingInfo';
import { ISitecoreField } from 'models/sitecore/generic/ISitecoreField';
import { usePreparedBookingDetailsData } from 'frontend/components/common/Booking/BookingCard/components/BookingCardDetails/BookingCardDetails.utils';
import SVGHoldBagFilled from 'frontend/components/icons-new/HoldBagFilled';

import styles from './LuggageDetails.module.scss';

export interface ILuggageDetailsProps {
    booking: IBookingInfo;
    dataTid: string;
    className?: string;
    titleField?: ISitecoreField<string>;
}

const LuggageDetails: FunctionComponent<ILuggageDetailsProps> = ({ booking, dataTid, className, titleField }) => {
    const { getPhrase } = useStore(({ layoutStore }: TStores) => ({
        getPhrase: layoutStore.getPhrase,
    }));

    const { details } = usePreparedBookingDetailsData(booking);
    const holdLuggageLabel = getHoldItemsLabel(details?.luggageCount, getPhrase);

    return (
        <div className={classNames(className, styles.content)} data-tid={`${dataTid}-hold-bags`}>
            <i className={styles.icon}>
                <SVGHoldBagFilled />
            </i>
            <div>
                {titleField && <Text field={titleField} tag='h4' />}
                <div>{holdLuggageLabel}</div>
            </div>
        </div>
    );
};

export default LuggageDetails;
