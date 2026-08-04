import { FC } from 'react';
import { ComponentRendering, Placeholder, Text } from '@sitecore-jss/sitecore-jss-nextjs';

import { usePoster } from 'frontend/hooks/usePoster';
import useStore from 'frontend/hooks/useStore';
import { IBookingInfo } from 'models/data/IBookingInfo';
import { IPrintPreviewFields } from 'models/data/IPrintPreviewFields';
import { CalloutOrientation, CalloutPosition } from 'models/enum/Callout';
import { PlaceholderNames } from 'models/enum/PlaceholderNames';
import SitecoreDictionary from 'models/enum/SitecoreDictionary';
import { ISitecoreField, ISitecoreLink } from 'models/sitecore/generic/ISitecoreField';
import BookingRefs from 'frontend/components/common/Booking/BookingRefs/BookingRefs';
import Button from 'frontend/components/common/Button';
import Callout from 'frontend/components/common/Callout/Callout';
import JSSImage from 'frontend/components/common/JSSImage';
import * as Poster from 'frontend/components/common/Poster';
import { IPosterError } from 'frontend/components/common/Poster';
import SvgDownloadApp from 'frontend/components/icons-new/DownloadApp';
import ComponentWrapper from 'frontend/components/renderings/static/ComponentWrapper';
import ViewBookingHotel from 'frontend/components/renderings/ViewBooking/components/Hotel/ViewBookingHotel';
import ViewBookingHolidayDetails from 'frontend/components/renderings/ViewBooking/components/ViewBookingHolidayDetails';

import styles from './ConfirmationPoster.module.scss';

export interface IConfirmationPosterFields extends IPrintPreviewFields {
    DownloadButton?: ISitecoreField<string>;
    ReadMoreLink?: ISitecoreField<ISitecoreLink>;
}

export interface IConfirmationPoster {
    booking: IBookingInfo;
    rendering: ComponentRendering;
    fields?: IConfirmationPosterFields;
    id?: string;
}

const ConfirmationPoster = (props: IConfirmationPoster): JSX.Element => (
    <Poster.Root>
        <ConfirmationPosterContent {...props} />
    </Poster.Root>
);

const ConfirmationPosterContent: FC<IConfirmationPoster> = ({ booking, rendering, fields, id = 'default' }) => {
    const { getPhrase } = useStore(stores => ({
        getPhrase: stores.layoutStore.getPhrase,
    }));
    const { posterId, hasEjLogo } = usePoster();
    const { name } = booking?.hotel || {};
    const routes = booking.package?.transport?.routes || [];
    const referenceNumber = booking.bookingReference;

    if (!fields || !booking || !name) {
        return null;
    }

    const {
        Title,
        Description,
        LogoImage,
        ExportPromoLabel,
        ExportPromoTooltip,
        ReturnLabel,
        LogoCheckboxLabel,
        DownloadLabel,
        DownloadButton,
        Logos,
        ...rest
    } = fields;

    if (!ExportPromoLabel) {
        return null;
    }

    const errorInfo: IPosterError = {
        title: getPhrase(SitecoreDictionary.BookingFailedTitlesSomethingWentWrong),
        errorMessage: getPhrase(SitecoreDictionary.BookingFailedLabelsPDFFailedDescription),
        button: getPhrase(SitecoreDictionary.BookingFailedButtonsTryAgain),
    };

    return (
        <>
            <div className={styles.wrapper} data-tid='confirmation-poster'>
                <div className={styles.textWrapper}>
                    <Text
                        tag='span'
                        field={ExportPromoLabel}
                        className={styles.tooltipText}
                        data-tid='confirmation-poster-tooltip'
                    />
                    {!!ExportPromoTooltip?.value && (
                        <Callout
                            content={<div>{ExportPromoTooltip.value}</div>}
                            orientation={CalloutOrientation.Top}
                            position={CalloutPosition.Center}
                            isShownOnHover
                        />
                    )}
                </div>
                {!!DownloadButton?.value && (
                    <Poster.Trigger id={id}>
                        <Button className={styles.downloadButton} dataTid='confirmation-poster-trigger' isOutlined>
                            <SvgDownloadApp />
                            {DownloadButton.value}
                        </Button>
                    </Poster.Trigger>
                )}
            </div>
            <Poster.Content
                id={id}
                ReturnLabel={ReturnLabel}
                LogoCheckboxLabel={LogoCheckboxLabel}
                DownloadLabel={DownloadLabel}
                posterName={name}
                hasLargeFormat
            >
                <div className={`view-booking ${styles.container}`}>
                    <div className={styles.info}>
                        <Text tag='h2' field={Title} className={styles.title} />
                        <Text tag='div' field={Description} className={styles.description} />
                    </div>
                    <div className={`${styles.poster} ${styles.globals}`} id={posterId}>
                        <Placeholder name={PlaceholderNames.HeroBannerTopSection} rendering={rendering} />

                        <div className={styles.toolbar} data-tid='toolbar'>
                            <BookingRefs bookingRoutes={routes} referenceNumber={referenceNumber} />
                            <div>
                                {hasEjLogo && (
                                    <JSSImage className={styles.logo} field={LogoImage} data-tid='easyjet-logo' />
                                )}
                                <JSSImage className={styles.logo} field={Logos} />
                            </div>
                        </div>

                        <div className='wrapper-container wrapper-container--px'>
                            {booking && <ViewBookingHotel booking={booking} rendering={rendering} isPrintPreview />}
                        </div>

                        <div className='wrapper-container wrapper-container--px'>
                            <Placeholder
                                name={PlaceholderNames.ViewBookingCost}
                                rendering={rendering}
                                subtitleClassName={styles.viewBookingCostSubtitle}
                                titleClassName={styles.viewBookingCostTitle}
                                containerClassName={styles.tradePortalViewBookingCost}
                            />
                        </div>

                        <ComponentWrapper params={{ IsGreyBackground: '1', IsTriangleStart: '1' }}>
                            <ViewBookingHolidayDetails
                                booking={booking}
                                fields={rest}
                                rendering={rendering}
                                showLeadEmailOnly
                                isPrintPreview
                            />
                        </ComponentWrapper>
                    </div>
                </div>
            </Poster.Content>
            <Poster.Error {...errorInfo} />
        </>
    );
};

export default ConfirmationPoster;
