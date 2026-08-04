import React, { useCallback, useEffect, useRef } from 'react';
import { observer } from 'mobx-react';

import useStore from 'frontend/hooks/useStore';
import { ITradePortalStores } from 'frontend/store/tradePortal';
import { EventTypes } from 'models/enum/tracking/EventTypes';
import { EventCategories, GENERIC_CUSTOM_PARAMS_EMPTY } from 'models/enum/tracking/GenericEventParams';
import { ISitecoreComponent } from 'models/sitecore/generic/ISitecoreComponent';
import { ISitecoreField } from 'models/sitecore/generic/ISitecoreField';
import SvgAlertMessages from 'frontend/components/icons-new/AlertMessages';
import { ALERT_INFO_ID } from 'frontend/components/renderings/AlertInformation/AlertInformation';

export interface IAlertMessagesBlocksFields {
    Anchor: ISitecoreField<string>;
    Link: ISitecoreField<string>;
}

interface IAlertMessagesBlockItem extends ISitecoreComponent<IAlertMessagesBlocksFields> {
    id: string;
}
interface IAlertMessagesFields {
    Links: IAlertMessagesBlockItem[];
    Title: ISitecoreField<string>;
}

type TAlertMessagesProps = ISitecoreComponent<IAlertMessagesFields>;

const AlertMessages = (props: TAlertMessagesProps) => {
    const infoBlockRef = useRef<HTMLElement | null>(null);
    const { setAlertActiveTab, alertInfoLoaded, trackEventWithParams } = useStore(
        ({ appStore, trackingStore }: ITradePortalStores) => ({
            setAlertActiveTab: appStore.setAlertActiveTab,
            alertInfoLoaded: appStore.alertInfoLoaded,
            trackEventWithParams: trackingStore.trackEventWithParams,
        }),
    );

    useEffect(() => {
        if (alertInfoLoaded) {
            infoBlockRef.current = document.getElementById(ALERT_INFO_ID);
        }
    }, [alertInfoLoaded]);

    const onClick = useCallback(
        (event, item) => {
            event.preventDefault();

            if (item.fields.Anchor) {
                setAlertActiveTab(item.fields.Anchor.value);
            }

            if (infoBlockRef.current) {
                infoBlockRef.current.scrollIntoView({ block: 'center' });
            }

            if (props.fields) {
                trackEventWithParams(
                    EventTypes.GenericEvent,
                    {
                        eventAction: props.fields.Title?.value,
                        eventCategory: EventCategories.AlertsModule,
                        eventLabel: item.fields.Link?.value,
                        eventType: EventTypes.Interaction,
                        eventValue: 'null',
                    },
                    GENERIC_CUSTOM_PARAMS_EMPTY,
                );
            }
        },
        [props.fields, setAlertActiveTab, trackEventWithParams],
    );

    if (!props.fields?.Links) {
        return null;
    }

    const { Title, Links } = props.fields;

    return (
        <section className='alert-messages' data-tid='alert-messages'>
            {Title?.value && (
                <div className='alert-messages__wrapper'>
                    <SvgAlertMessages />
                    <p className='alert-messages__title'>{Title.value}</p>
                </div>
            )}
            <ul>
                {Links.map(item => (
                    <li key={item.id}>
                        <a className='alert-messages__link' onClick={e => onClick(e, item)}>
                            {item.fields?.Link?.value}
                        </a>
                    </li>
                ))}
            </ul>
        </section>
    );
};

export default observer(AlertMessages);
