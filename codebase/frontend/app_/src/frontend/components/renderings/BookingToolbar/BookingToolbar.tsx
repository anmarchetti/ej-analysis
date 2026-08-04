import { FC, useContext, useEffect } from 'react';
import { useInView } from 'react-intersection-observer';
import { Placeholder, Text } from '@sitecore-jss/sitecore-jss-nextjs';
import classNames from 'classnames';

import { DATE_FORMATS } from 'code/dates';
import { BookingContext } from 'frontend/context/BookingContext';
import { useMoreThenTabletViewport } from 'frontend/hooks/useMediaQuery';
import useStore from 'frontend/hooks/useStore';
import { isHolidayStore } from 'frontend/store/holidays';
import { TStores } from 'frontend/store/IStores';
import { formatDateL10n } from 'frontend/utils/date.utils';
import { TravelDocsTypes, ViewBookingTrackingEvents } from 'frontend/utils/tracking/viewBooking.utils';
import {
    getBookingPdfFileName,
    getCheckInLink,
    getPdfLinks,
    getPdfRequestBody,
} from 'frontend/utils/viewBooking.utils';
import { BookingStatus } from 'models/enum/BookingStatus';
import { FileType } from 'models/enum/FileType';
import { PlaceholderNames } from 'models/enum/PlaceholderNames';
import SitecoreDictionary from 'models/enum/SitecoreDictionary';
import { ISitecoreComponent } from 'models/sitecore/generic/ISitecoreComponent';
import { ISitecoreField } from 'models/sitecore/generic/ISitecoreField';
import BookingRefs from 'frontend/components/common/Booking/BookingRefs/BookingRefs';
import PrintButton from 'frontend/components/common/Booking/Header/PrintButton';
import FileDownload from 'frontend/components/common/FileDownload';
import Link from 'frontend/components/common/Link';
import RichTextWithLinks from 'frontend/components/common/RichTextWithLinks';
import { STICKY_BOX_ID } from 'frontend/components/common/StickyBox';
import SvgCopy from 'frontend/components/icons-new/Copy';
import SvgDownloadApp from 'frontend/components/icons-new/DownloadApp';

import styles from './BookingToolbar.module.scss';

interface IBookingToolbarFields {
    CancelledOnLabel: ISitecoreField<string>;
    CheckInNowLabel: ISitecoreField<string>;
}

export type TBookingToolbarProps = ISitecoreComponent<IBookingToolbarFields>;

const BookingToolbar: FC<TBookingToolbarProps> = ({ fields, rendering }) => {
    const { booking } = useContext(BookingContext);

    const {
        getPhrase,
        getSetting,
        isTradePortal,
        isCheckInAvailable,
        fireViewBookingTrackingEvent,
        isHotelCheckInEnabled,
        isPostTravelPage,
        isFlightAndHotelPackage,
    } = useStore((stores: TStores) => ({
        getPhrase: stores.layoutStore.getPhrase,
        getSetting: stores.layoutStore.getSetting,
        isTradePortal: stores.layoutStore.isTradePortal,
        isCheckInAvailable: stores.bookingStore.isCheckInAvailable,
        fireViewBookingTrackingEvent: isHolidayStore(stores) ? stores.trackingStore.fireViewBookingEvent : null,
        isHotelCheckInEnabled: stores.layoutStore.isHotelCheckInEnabled,
        isPostTravelPage: isHolidayStore(stores) ? stores.viewBookingStore.isPostTravelPage : null,
        isFlightAndHotelPackage: isHolidayStore(stores) ? stores.viewBookingStore.isFlightAndHotelPackage : false,
    }));

    const isMoreThenTabletViewport = useMoreThenTabletViewport();

    const { ref, inView } = useInView();

    useEffect(() => {
        const stickyBoxElement = document.getElementById(STICKY_BOX_ID);

        if (inView) {
            stickyBoxElement?.style.setProperty('display', 'none');
        } else {
            stickyBoxElement?.style.removeProperty('display');
        }

        return () => {
            stickyBoxElement?.style.removeProperty('display');
        };
    }, [inView]);

    if (!booking) {
        return null;
    }

    const { bookingReference, bookingStatus, cancellationDate } = booking;
    const routes = booking.package?.transport?.routes || [];
    const isBookingCanceled = bookingStatus === BookingStatus.Canceled;
    const cancelledDate = formatDateL10n(cancellationDate, DATE_FORMATS.L);

    const fireTrackingDownloadEvent = (type: TravelDocsTypes) => () => {
        fireViewBookingTrackingEvent?.(ViewBookingTrackingEvents.TravelDocs, `Travel Docs-${type}`);
    };

    const isFileDownloadShown = !booking.isExternalAgency;
    const isVATDocAvailable = isFlightAndHotelPackage && isPostTravelPage && !booking.isExternalAgency;
    const isPrintButtonShown = isMoreThenTabletViewport && !isPostTravelPage;

    const checkInLink = getCheckInLink(booking, getSetting);
    const bookingPdfRequestData = getPdfRequestBody(booking);
    const isFlightCheckInShown = checkInLink && isCheckInAvailable(booking);
    const isCheckInButtonsShown = isFlightCheckInShown || isHotelCheckInEnabled;

    const isButtonsShown =
        isPostTravelPage ||
        (!isBookingCanceled &&
            !isTradePortal &&
            (isCheckInButtonsShown || isFileDownloadShown || isPrintButtonShown || isVATDocAvailable));

    return (
        <div className={styles.toolbar} data-tid='booking-toolbar' ref={ref}>
            <div className='wrapper-container wrapper-container--px'>
                <Placeholder name={PlaceholderNames.ToolbarTopSection} rendering={rendering} />
                <div
                    className={classNames(styles.container, {
                        [styles.cancelledPageToolbar]: isBookingCanceled,
                    })}
                >
                    <BookingRefs
                        bookingRoutes={routes}
                        referenceNumber={bookingReference}
                        hasTooltips={!isPostTravelPage}
                    />
                    {isBookingCanceled ? (
                        <div className={styles.cancelledInfo} data-tid='cancelled-info'>
                            <Text tag='div' field={fields?.CancelledOnLabel} />
                            <div className={styles.cancelledDate} data-tid='cancelled-date'>
                                {cancelledDate}
                            </div>
                        </div>
                    ) : (
                        <div className={styles.buttonsContainer} data-tid='buttons-container'>
                            {isFlightCheckInShown && !isFlightAndHotelPackage && (
                                <RichTextWithLinks field={fields?.CheckInNowLabel} className={styles.checkInNowLabel} />
                            )}
                            {isButtonsShown && (
                                <div className={styles.buttonsWrapper} data-tid='toolbar-buttons'>
                                    {isPrintButtonShown && (
                                        <PrintButton
                                            isText
                                            dataTid='print-btn-toolbar'
                                            onClick={fireTrackingDownloadEvent(TravelDocsTypes.PrintButton)}
                                            className={styles.transparentBtn}
                                        />
                                    )}
                                    {isFileDownloadShown && (
                                        <FileDownload
                                            fileName={getBookingPdfFileName()}
                                            fileType={FileType.Pdf}
                                            fileURL={getPdfLinks(booking, 'booking')}
                                            fileRequestData={bookingPdfRequestData}
                                            buttonDataTid='download-btn-toolbar'
                                            showLoginPopup={!booking.isLoggedInAsLeadPassenger}
                                            onClick={fireTrackingDownloadEvent(TravelDocsTypes.DownloadButton)}
                                            isText
                                            buttonClassName={classNames(
                                                styles.transparentBtn,
                                                styles.travelDocumentBtn,
                                            )}
                                        >
                                            <SvgDownloadApp />
                                            <span className='text-truncate'>
                                                {getPhrase(SitecoreDictionary.ViewBookingNavigationTravelDocuments)}
                                            </span>
                                        </FileDownload>
                                    )}
                                    {isVATDocAvailable && (
                                        <FileDownload
                                            fileName={'Payment receipt.pdf'}
                                            fileType={FileType.Pdf}
                                            fileURL={getPdfLinks(booking, 'paymentReceipt')}
                                            buttonDataTid='download-receipt-toolbar'
                                            showLoginPopup={!booking.isLoggedInAsLeadPassenger}
                                            onClick={fireTrackingDownloadEvent(TravelDocsTypes.DownloadReceipt)}
                                            isText
                                            buttonClassName={classNames(
                                                styles.transparentBtn,
                                                styles.travelDocumentBtn,
                                            )}
                                            errorMessage={getPhrase(
                                                SitecoreDictionary.FlightPlusHotelPaymentReceiptDownloadError,
                                            )}
                                        >
                                            <SvgCopy />
                                            <span className='text-truncate'>
                                                {getPhrase(
                                                    SitecoreDictionary.FlightPlusHotelPaymentReceiptDownloadButton,
                                                )}
                                            </span>
                                        </FileDownload>
                                    )}
                                    {isFlightCheckInShown && (
                                        <div className={styles.checkInBtns}>
                                            <Link
                                                href={checkInLink}
                                                className={classNames(styles.borderedBtn, styles.orangeBtn)}
                                                rel='noopener noreferrer'
                                                target='_blank'
                                                data-tid='check-in-link'
                                            >
                                                <span className='text-truncate'>
                                                    {getPhrase(SitecoreDictionary.ViewBookingButtonsFlightCheckIn)}
                                                </span>
                                            </Link>
                                        </div>
                                    )}
                                    <Placeholder name={PlaceholderNames.HotelSummary} rendering={rendering} />
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default BookingToolbar;
