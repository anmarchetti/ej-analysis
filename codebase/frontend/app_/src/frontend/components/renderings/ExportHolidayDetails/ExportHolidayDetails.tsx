import { FunctionComponent, useEffect, useState } from 'react';
import { Text } from '@sitecore-jss/sitecore-jss-nextjs';
import classNames from 'classnames';
import { observer } from 'mobx-react';

import { DATE_FORMATS } from 'code/dates';
import useAgentLogo from 'frontend/hooks/useAgentLogo';
import useStore from 'frontend/hooks/useStore';
import { formatDateL10n } from 'frontend/utils/date.utils';
import { IPrintPreviewFields } from 'models/data/IPrintPreviewFields';
import SitecoreDictionary from 'models/enum/SitecoreDictionary';
import { ISitecoreComponent } from 'models/sitecore/generic/ISitecoreComponent';
import { ISitecoreField, ISitecoreLink } from 'models/sitecore/generic/ISitecoreField';
import { ICabinBagsInfoFields } from 'frontend/components/common/Booking/CabinBagsInfo/CabinBagsInfo';
import { ILuggageInfoFields } from 'frontend/components/common/Booking/LuggageInfo/LuggageInfo';
import Button from 'frontend/components/common/Button';
import * as Poster from 'frontend/components/common/Poster';
import { IPosterError } from 'frontend/components/common/Poster';
import { Tooltip, TooltipContent, TooltipTrigger } from 'frontend/components/common/Tooltip';

import ExtrasLayout from './components/ExtrasLayout/ExtrasLayout';

import styles from './ExportHolidayDetails.module.scss';

export interface IExportHolidayDetailsFields extends IPrintPreviewFields {
    ReadMoreLink?: ISitecoreField<ISitecoreLink>;
}

export interface IExportHolidayQuoteFields
    extends IExportHolidayDetailsFields,
        ILuggageInfoFields,
        ICabinBagsInfoFields {}

export interface IHotelPosterProps extends ISitecoreComponent<IExportHolidayQuoteFields> {
    id?: string;
}

export const ExportHolidayDetails = (props: IHotelPosterProps): JSX.Element => (
    <Poster.Root>
        <ExportHolidayDetailsContent {...props} />
    </Poster.Root>
);

export const ExportHolidayDetailsContent: FunctionComponent<IHotelPosterProps> = ({ fields, id = 'default' }) => {
    const { getPhrase, hotelInfo, offer } = useStore(stores => ({
        getPhrase: stores.layoutStore.getPhrase,
        hotelInfo: stores.bookingStore.hotel,
        offer: stores.bookingStore.selectedOffer,
    }));

    const [offerTimestamp, setOfferTimestamp] = useState<number>();

    useEffect(() => {
        setOfferTimestamp(Date.now());
    }, []);

    const UMLogoImage = useAgentLogo();

    if (!fields || !hotelInfo || !offer) {
        return null;
    }

    const { name, images } = hotelInfo;
    const { accom } = offer;
    const {
        Title,
        Description,
        ExportPromoTooltip,
        ExportPromoLabel,
        ReturnLabel,
        LogoCheckboxLabel,
        ShowAgentLogoCheckboxLabel,
        DownloadLabel,
    } = fields;

    if (!accom || !images || !name) {
        return null;
    }

    const errorInfo: IPosterError = {
        title: getPhrase(SitecoreDictionary.BookingFailedTitlesSomethingWentWrong),
        errorMessage: getPhrase(SitecoreDictionary.BookingFailedLabelsPDFFailedDescription),
        button: getPhrase(SitecoreDictionary.BookingFailedButtonsTryAgain),
    };

    const offerDate = formatDateL10n(offerTimestamp, DATE_FORMATS.defaultShort);
    const offerTime = formatDateL10n(offerTimestamp, DATE_FORMATS.time);

    return (
        <>
            <div className={styles.triggerwrapper}>
                <Poster.Trigger id={id}>
                    <Button
                        className={classNames([styles.button, styles.promoButton])}
                        data-tid='hotel-poster-download'
                        isText
                    >
                        {!!ExportPromoLabel && <Text tag='span' field={ExportPromoLabel} />}
                    </Button>
                </Poster.Trigger>
                {ExportPromoTooltip?.value && (
                    <Tooltip placement='right'>
                        <TooltipTrigger className={styles.icon} />
                        <TooltipContent>
                            <Text field={ExportPromoTooltip} />
                        </TooltipContent>
                    </Tooltip>
                )}
            </div>
            <Poster.Content
                id={id}
                ReturnLabel={ReturnLabel}
                LogoCheckboxLabel={LogoCheckboxLabel}
                ShowAgentLogoCheckboxLabel={ShowAgentLogoCheckboxLabel}
                DownloadLabel={DownloadLabel}
                UMLogoImage={UMLogoImage}
                posterName={name}
                hasLargeFormat
            >
                <div className={styles.container}>
                    <div className={styles.info}>
                        {Title && <Text tag='h2' field={Title} className={styles.title} />}
                        {Description && <Text tag='div' field={Description} className={styles.description} />}
                    </div>
                    <ExtrasLayout fields={fields} timeText={offerTime} dateText={offerDate} UMLogoImage={UMLogoImage} />
                </div>
            </Poster.Content>
            <Poster.Error {...errorInfo} />
        </>
    );
};

export default observer(ExportHolidayDetails);
