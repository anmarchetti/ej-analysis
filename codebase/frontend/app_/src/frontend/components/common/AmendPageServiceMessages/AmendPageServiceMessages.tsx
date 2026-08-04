import { FunctionComponent, useEffect, useState } from 'react';
import { ComponentRendering, Placeholder } from '@sitecore-jss/sitecore-jss-nextjs';
import { observer } from 'mobx-react';

import useStore from 'frontend/hooks/useStore';
import { IHolidaysStores } from 'frontend/store/holidays';
import { GuestType } from 'models/enum/GuestType';
import { PlaceholderNames } from 'models/enum/PlaceholderNames';

import { AmendServiceMessages, fetchErrataOfferMessages, TErrataOverrides } from './AmendPageServiceMessages.utils';

import styles from './AmendPageServiceMessages.module.scss';

interface IAmendPageServicesMessagesProps {
    rendering: ComponentRendering;
    errataOverrides?: TErrataOverrides;
}

const AmendPageServiceMessages: FunctionComponent<IAmendPageServicesMessagesProps> = ({
    rendering,
    errataOverrides,
}) => {
    const [hotelErrataMessages, setHotelErrataMessages] = useState<string[]>([]);
    const { booking, isAmendRoomAndBoardPage, roomVariants, isFreeChildPlaceVariantIncluded } = useStore(
        (stores: IHolidaysStores) => ({
            booking: stores.viewBookingStore.booking,
            isAmendRoomAndBoardPage: stores.layoutStore.isAmendRoomAndBoardPage,
            roomVariants: stores.amendRoomAndBoardStore.roomVariants,
            isFreeChildPlaceVariantIncluded: stores.amendRoomAndBoardStore.isFreeChildPlaceVariantIncluded,
        }),
    );

    useEffect(() => {
        if (!booking) {
            return;
        }

        const getErrataMessages = async () => {
            const messages = await fetchErrataOfferMessages(booking, errataOverrides);

            setHotelErrataMessages(messages.map(message => message.replace(/(<br>(\s){2})|(\s{2}<br>)/g, '').trim()));
        };

        getErrataMessages();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [booking]);

    if (!booking) {
        return null;
    }

    const serviceMessageRenderCustomMetaData = (type?: string) => {
        if (type === AmendServiceMessages.Errata) {
            return {
                fields: {
                    Description: { value: hotelErrataMessages.join('<br />') },
                },
                isVisible: !!hotelErrataMessages.length,
                isExpandedByDefault: false,
            };
        }

        if (type === AmendServiceMessages.FreeChildPlace && isAmendRoomAndBoardPage) {
            const isChildInBooking = booking.guests.some(({ type }) => type === GuestType.Child);

            return {
                isVisible: !!roomVariants.length && isChildInBooking && !isFreeChildPlaceVariantIncluded,
            };
        }

        return {};
    };

    return (
        <Placeholder
            name={PlaceholderNames.AttentionMessage}
            containerClassName={styles.serviceMessage}
            rendering={rendering}
            renderCustomMetaData={serviceMessageRenderCustomMetaData}
            collapsible
        />
    );
};

export default observer(AmendPageServiceMessages);
