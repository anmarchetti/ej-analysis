import React from 'react';
import classNames from 'classnames';

import { cmsUrls } from 'code/endpoints';
import useStore from 'frontend/hooks/useStore';
import { TStores } from 'frontend/store/IStores';
import { GuestTypeIcon } from 'models/data/GuestTypeIcon';
import { GuestType } from 'models/enum/GuestType';
import SitecoreDictionary from 'models/enum/SitecoreDictionary';
import SiteSettings from 'models/enum/SiteSettings';
import { GuestInfo } from 'models/GuestInfo';
import SvgEmailFilled from 'frontend/components/icons-new/EmailFilled';
import SvgPhoneFilled from 'frontend/components/icons-new/PhoneFilled';

import styles from './GuestDetails.module.scss';

export interface IGuestDetailsProps {
    guestsDetails: GuestInfo[];
    leadPassenger: Nullable<GuestInfo>;
}

const GuestDetails = ({ guestsDetails, leadPassenger }: IGuestDetailsProps) => {
    const { getPhrase, getSetting, isTradePortal } = useStore((stores: TStores) => ({
        getPhrase: stores.layoutStore.getPhrase,
        getSetting: stores.layoutStore.getSetting,
        isTradePortal: stores.layoutStore.isTradePortal,
    }));

    const getIconsUrl = (details: GuestInfo): SiteSettings => {
        const matchesGenderOrType = details.type ?? details.Sex;

        return GuestTypeIcon[matchesGenderOrType] || GuestTypeIcon.Default;
    };

    return (
        <>
            <div className={styles.listItem}>
                {guestsDetails.map((details, idx) => (
                    <div className={styles.guestDetailsItem} key={idx}>
                        <span
                            className={classNames(isTradePortal && styles.bgIcon)}
                            style={{
                                backgroundImage: `url(${cmsUrls.media(getSetting(getIconsUrl(details)))}`,
                            }}
                        />
                        <span data-tid='guest-name'>
                            {details.title} {details.firstName} {details.lastName}
                        </span>{' '}
                        {details.isLead && (
                            <span className={classNames(isTradePortal && styles.clarification)}>
                                ({getPhrase(SitecoreDictionary.PaymentLabelsIsLead)})
                            </span>
                        )}
                        {(details.type === GuestType.Child ?? details.type === GuestType.Infant) && details.age && (
                            <span className={classNames(isTradePortal && styles.clarification)}>
                                ({details.age} {getPhrase(SitecoreDictionary.PaymentLabelsYears)})
                            </span>
                        )}
                    </div>
                ))}
            </div>
            {leadPassenger && (
                <div className={styles.listItem}>
                    {leadPassenger.email && (
                        <div className={styles.guestDetailsItem}>
                            <SvgEmailFilled className={styles.svgIcon} />
                            <span data-tid='lead-guest-email'>{leadPassenger.email}</span>
                        </div>
                    )}
                    {leadPassenger.phone && (
                        <div className={styles.guestDetailsItem}>
                            <SvgPhoneFilled className={styles.svgIcon} />
                            <span data-tid='lead-guest-phone'>
                                {leadPassenger.dialingCode}
                                {leadPassenger.phone}
                            </span>
                        </div>
                    )}
                </div>
            )}
        </>
    );
};

export default GuestDetails;
