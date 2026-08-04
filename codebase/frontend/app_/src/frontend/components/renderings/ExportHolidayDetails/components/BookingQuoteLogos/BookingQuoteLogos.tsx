import { Fragment, FunctionComponent } from 'react';
import { Text } from '@sitecore-jss/sitecore-jss-nextjs';

import { ISitecoreField, ISitecoreImage } from 'models/sitecore/generic/ISitecoreField';
import JSSImage from 'frontend/components/common/JSSImage';
import { IExportHolidayQuoteFields } from 'frontend/components/renderings/ExportHolidayDetails/ExportHolidayDetails';

import styles from './BookingQuoteLogos.module.scss';

export interface IBookingQuoteLogosProps {
    dateText: string;
    extraLogo: ISitecoreField<ISitecoreImage> | undefined;
    fields: IExportHolidayQuoteFields;
    hasEjLogo: boolean;
    hasUMLogo: boolean;
    logoImage: ISitecoreField<ISitecoreImage> | undefined;
    timeText: string;
    UMLogoImage?: string;
    agentName?: string;
}

export const BookingQuoteLogos: FunctionComponent<IBookingQuoteLogosProps> = ({
    extraLogo,
    logoImage,
    hasEjLogo,
    hasUMLogo,
    UMLogoImage,
    fields,
    agentName,
    dateText,
    timeText,
}) => {
    const { YourHolidayQuoteLabel } = fields;
    const quoteText = agentName ? `${agentName}, ${dateText} - ${timeText}` : `${dateText} - ${timeText}`;

    return (
        <Fragment>
            <div className={styles.mainLogo}>
                {!!logoImage?.value.src && hasEjLogo && <JSSImage field={logoImage} dataTid='easyjet-logo' />}
                {hasUMLogo && UMLogoImage && <img src={UMLogoImage} data-tid='um-logo' alt='um-logo' />}
                <span>
                    <Text className={styles.quoteSubtitle} tag='div' field={YourHolidayQuoteLabel} />
                    <div className={styles.quoteText}>{quoteText}</div>
                </span>
            </div>
            <div>{!!extraLogo?.value.src && <JSSImage field={extraLogo} dataTid='additional-logos' />}</div>
        </Fragment>
    );
};
