import React, { FC } from 'react';
import classNames from 'classnames';
import { observer } from 'mobx-react';

import useStore from 'frontend/hooks/useStore';
import { IHolidaysStores } from 'frontend/store/holidays';
import { getTotalHoursDifference } from 'frontend/utils/date.utils';
import { ISitecoreComponent } from 'models/sitecore/generic/ISitecoreComponent';
import { ISitecoreField, ISitecoreImage, ISitecoreLink } from 'models/sitecore/generic/ISitecoreField';
import InfoBlock from 'frontend/components/common/InfoBlock/InfoBlock';
import LuxuryWrapper from 'frontend/components/common/LuxuryWrapper/LuxuryWrapper';

import styles from './AmendRestrictions.module.scss';

interface IAmendRestrictionsItemFields {
    Description: ISitecoreField<string>;
    Icon: ISitecoreField<ISitecoreImage>;
    Link: ISitecoreField<ISitecoreLink>;
    TimeRestriction: ISitecoreField<number>;
    Title: ISitecoreField<string>;
    CTA?: ISitecoreField<string>;
    IsExternal?: ISitecoreField<boolean>;
    IsLux?: ISitecoreField<boolean>;
}

interface IAmendRestrictionsFields {
    items: {
        fields: IAmendRestrictionsItemFields;
    }[];
}

export interface IAmendRestrictionsProps extends ISitecoreComponent<IAmendRestrictionsFields> {
    depDate: Date;
    isExternalAgency?: boolean;
    isLeadLoggedIn?: boolean;
}

const AmendRestrictions: FC<IAmendRestrictionsProps> = ({ fields, depDate, isExternalAgency, isLeadLoggedIn }) => {
    const { isLuxuryPackage, toggleHelpPopup, isTradePortal } = useStore((stores: IHolidaysStores) => ({
        isLuxuryPackage: stores.viewBookingStore.isLuxuryPackage,
        toggleHelpPopup: stores.viewBookingStore.toggleHelpPopup,

        isTradePortal: stores.layoutStore.isTradePortal,
    }));

    const getContent = (): IAmendRestrictionsItemFields | undefined => {
        if (isExternalAgency && !isTradePortal && isLuxuryPackage) {
            return fields?.items?.find(({ fields }) => fields?.IsLux?.value && fields?.IsExternal?.value)?.fields;
        }

        if (isExternalAgency && !isTradePortal && !isLuxuryPackage) {
            return fields?.items?.find(({ fields }) => !fields?.IsLux?.value && fields?.IsExternal?.value)?.fields;
        }

        if (isLuxuryPackage) {
            return fields?.items?.find(({ fields }) => fields?.IsLux?.value && !fields?.IsExternal?.value)?.fields;
        }

        const hoursToDep = getTotalHoursDifference(depDate, new Date());
        const restrictionField = fields?.items?.find(field => {
            const timeRestriction = field.fields?.TimeRestriction?.value;

            return timeRestriction && timeRestriction > hoursToDep;
        });

        return (
            fields?.items?.find(
                ({ fields }) => !fields?.TimeRestriction?.value && !fields?.IsExternal?.value && !fields?.IsLux?.value,
            )?.fields || restrictionField?.fields
        );
    };

    const dataField = getContent();

    if (!dataField) {
        return null;
    }

    const { Title, Description, Link, Icon, CTA } = dataField;

    const isRenderMessage = isLeadLoggedIn && !isExternalAgency;

    return (
        <div className={styles.amendRestrictions}>
            {isLuxuryPackage ? (
                <LuxuryWrapper label={Title.value}>
                    <InfoBlock
                        text={Description}
                        icon={Icon}
                        ctaClass={classNames(styles.action, styles.luxuryAction)}
                        btnLabel={CTA}
                        iconClass={styles.icon}
                        onClick={(): void => toggleHelpPopup(true)}
                        className={styles.luxuryInfoBlock}
                    />
                </LuxuryWrapper>
            ) : (
                <>
                    {isExternalAgency && (
                        <InfoBlock title={Title} text={Description} icon={Icon} className={styles.infoBlock} />
                    )}
                    {isRenderMessage && (
                        <InfoBlock
                            title={Title}
                            text={Description}
                            icon={Icon}
                            link={Link}
                            btnClass={styles.action}
                            className={styles.infoBlock}
                        />
                    )}
                </>
            )}
        </div>
    );
};

export default observer(AmendRestrictions);
