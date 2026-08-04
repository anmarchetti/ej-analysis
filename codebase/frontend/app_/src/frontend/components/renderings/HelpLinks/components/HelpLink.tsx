import { ChangeEvent, FC } from 'react';
import { Text } from '@sitecore-jss/sitecore-jss-nextjs';
import classNames from 'classnames';

import useStore from 'frontend/hooks/useStore';
import { isHolidayStore } from 'frontend/store/holidays';
import { TStores } from 'frontend/store/IStores';
import { ViewBookingTrackingEvents } from 'frontend/utils/tracking/viewBooking.utils';
import { HelpLinksVariant } from 'models/enum/HelpLinksVariant';
import { ISitecoreComponent } from 'models/sitecore/generic/ISitecoreComponent';
import { ISitecoreField, ISitecoreImage, ISitecoreLink } from 'models/sitecore/generic/ISitecoreField';
import JSSImage from 'frontend/components/common/JSSImage';
import RouterLink from 'frontend/components/common/RouterLink';
import SvgChevronRight from 'frontend/components/icons-new/ChevronRight';

import styles from './HelpLink.module.scss';

export interface IHelpLinkFields {
    Description: ISitecoreField<string>;
    Icon: ISitecoreField<ISitecoreImage>;
    Link: ISitecoreField<ISitecoreLink>;
    OpenChatBot: ISitecoreField<boolean>;
    Title: ISitecoreField<string>;
    TrackingLabel: ISitecoreField<string>;
}

export interface IHelpLinkProps extends ISitecoreComponent<IHelpLinkFields> {
    Variant?: HelpLinksVariant;
}

export const HelpLink: FC<IHelpLinkProps> = ({ fields, Variant }) => {
    const { fireViewBookingTrackingEvent } = useStore((stores: TStores) => ({
        ...(isHolidayStore(stores) && {
            fireViewBookingTrackingEvent: stores.trackingStore.fireViewBookingEvent,
        }),
    }));

    if (!fields) {
        return null;
    }

    const openChatBot = (e, isOpenChatBot) => {
        if (isOpenChatBot) {
            e.preventDefault();
            const botEl = document.querySelector('df-messenger');
            botEl?.setAttribute('expand', 'true');
            try {
                // On default MINimized chat is expanded and public API allows opening only this version.
                // (see public api https://cloud.google.com/dialogflow/es/docs/integrations/dialogflow-messenger#js-func)
                // So try to open a MAXimized chat using private API.
                botEl?.shadowRoot?.querySelector('df-messenger-chat')?.['messageList']?.maximizeChat_?.();
            } catch (e) {}
        }
    };

    const { Icon, Link, Description, TrackingLabel, OpenChatBot, Title } = fields;

    const handleLinkClick = (e: ChangeEvent): void => {
        const trackingLabel = TrackingLabel.value ? `Help FAQ-${TrackingLabel.value}` : null;

        openChatBot(e, OpenChatBot.value);
        fireViewBookingTrackingEvent?.(ViewBookingTrackingEvents.Help, trackingLabel);
    };

    const containerClassName = classNames({
        [styles.helpLink]: true,
        [styles.horizontalAlignment]:
            Variant === HelpLinksVariant.CardWithBorder || Variant === HelpLinksVariant.HorizontalAlignment,
    });

    return (
        <RouterLink link={Link} onClick={handleLinkClick} dataId='content-link-title' className={containerClassName}>
            <JSSImage data-tid='quick-link-icon' field={Icon} className={styles.icon} aria-hidden={true} />
            <div className={styles.content}>
                <div className={styles.linkTitleWrapper} data-tid='help-link-title-wrapper'>
                    <div className={styles.linkTitle}>{Title.value || Link.value.text}</div>
                    <i className={styles.arrow}>
                        <SvgChevronRight />
                    </i>
                </div>
                <Text field={Description} tag='div' className={styles.description} data-tid='help-link-description' />
            </div>
        </RouterLink>
    );
};

export default HelpLink;
