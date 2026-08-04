import { FC } from 'react';
import { observer } from 'mobx-react';

import { useMobileViewport } from 'frontend/hooks/useMediaQuery';
import useStore from 'frontend/hooks/useStore';
import { isHolidayStore } from 'frontend/store/holidays';
import { TStores } from 'frontend/store/IStores';
import { TravelDocsTypes, ViewBookingTrackingEvents } from 'frontend/utils/tracking/viewBooking.utils';
import { getBookingPdfFileName, getPdfLinks, getPdfRequestBody } from 'frontend/utils/viewBooking.utils';
import { FileType } from 'models/enum/FileType';
import { ISitecoreComponent } from 'models/sitecore/generic/ISitecoreComponent';
import { ISitecoreField } from 'models/sitecore/generic/ISitecoreField';
import PrintButton from 'frontend/components/common/Booking/Header/PrintButton';
import FileDownload from 'frontend/components/common/FileDownload';
import StickyBox from 'frontend/components/common/StickyBox';
import TruncatedTooltip from 'frontend/components/common/TruncatedTooltip';
import SvgDownloadApp from 'frontend/components/icons-new/DownloadApp';

import BookingReferencesDropdown from './components/BookingReferencesDropdown';

import styles from './BookingDownloadBanner.module.scss';

export type TBookingDownloadBannerFields = {
    CopyButtonAriaLabel: ISitecoreField<string>;
    FlightReferenceDescription: ISitecoreField<string>;
    FlightReferenceTitle: ISitecoreField<string>;
    HolidayReferenceDescription: ISitecoreField<string>;
    HolidayReferenceTitle: ISitecoreField<string>;
    ReferencesTitle: ISitecoreField<string>;
    TravelDocumentsTitle: ISitecoreField<string>;
};

export type TBookingDownloadBannerProps = ISitecoreComponent<TBookingDownloadBannerFields>;

export const BookingDownloadBanner: FC<TBookingDownloadBannerProps> = ({ fields }) => {
    const { booking, fireViewBookingTrackingEvent } = useStore((stores: TStores) => ({
        booking: stores.viewBookingStore.booking,
        fireViewBookingTrackingEvent: isHolidayStore(stores) ? stores.trackingStore.fireViewBookingEvent : null,
    }));

    const isMobile = useMobileViewport();

    if (!booking || !fields) {
        return null;
    }

    const fireTrackingDownloadEvent = (type: TravelDocsTypes) => () => {
        fireViewBookingTrackingEvent?.(ViewBookingTrackingEvents.TravelDocs, `Travel Docs-${type}`);
    };

    const bookingPdfLink = getPdfLinks(booking);
    const bookingPdfRequestData = getPdfRequestBody(booking);
    const bookingPdfFileName = getBookingPdfFileName();
    const routes = booking.package?.transport?.routes || [];
    const { isLoggedInAsLeadPassenger, isExternalAgency } = booking;

    return (
        <StickyBox
            stickyMobile={isMobile}
            className={styles.stickyBar}
            id='booking-download-banner'
            render={(): JSX.Element => (
                <nav className={styles.navBar}>
                    <div className='wrapper-container wrapper-container--px'>
                        <BookingReferencesDropdown
                            bookingReference={booking.bookingReference}
                            bookingRoutes={routes}
                            fields={fields}
                            isCopyButtonShown={isMobile}
                        />
                        <div className={styles.extra}>
                            <div className={styles.container}>
                                {isLoggedInAsLeadPassenger && (
                                    <TruncatedTooltip
                                        text={fields.TravelDocumentsTitle?.value}
                                        id='download-pdf-label'
                                        className={styles.extraLabel}
                                    />
                                )}

                                <div className={styles.buttonsWrapper}>
                                    <PrintButton
                                        isLabelHidden
                                        isText
                                        dataTid='print-btn'
                                        onClick={fireTrackingDownloadEvent(TravelDocsTypes.PrintButton)}
                                        className={styles.printBtn}
                                    />
                                    {!isExternalAgency && (
                                        <FileDownload
                                            fileName={bookingPdfFileName}
                                            fileType={FileType.Pdf}
                                            fileURL={bookingPdfLink}
                                            fileRequestData={bookingPdfRequestData}
                                            buttonClassName={styles.travelDocumentBtn}
                                            isTransparent
                                            buttonDataTid='download-btn-nav-bar'
                                            ariaLabel={fields.TravelDocumentsTitle?.value}
                                            showLoginPopup={!isLoggedInAsLeadPassenger}
                                        >
                                            <SvgDownloadApp />
                                        </FileDownload>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </nav>
            )}
        />
    );
};

export default observer(BookingDownloadBanner);
