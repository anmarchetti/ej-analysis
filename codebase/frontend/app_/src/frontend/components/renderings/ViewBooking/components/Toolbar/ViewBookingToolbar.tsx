import { FC, useState } from 'react';
import { ComponentRendering, Placeholder } from '@sitecore-jss/sitecore-jss-nextjs';
import classNames from 'classnames';

import { useMoreThenTabletViewport } from 'frontend/hooks/useMediaQuery';
import useStore from 'frontend/hooks/useStore';
import { isHolidayStore } from 'frontend/store/holidays';
import { TStores } from 'frontend/store/IStores';
import { TravelDocsTypes, ViewBookingTrackingEvents } from 'frontend/utils/tracking/viewBooking.utils';
import { getCheckInLink, getPdfRequestBody } from 'frontend/utils/viewBooking.utils';
import { IBookingInfo } from 'models/data/IBookingInfo';
import { FileType } from 'models/enum/FileType';
import { PlaceholderNames } from 'models/enum/PlaceholderNames';
import SitecoreDictionary from 'models/enum/SitecoreDictionary';
import BookingRefs from 'frontend/components/common/Booking/BookingRefs/BookingRefs';
import PrintButton from 'frontend/components/common/Booking/Header/PrintButton';
import Button from 'frontend/components/common/Button';
import FileDownload from 'frontend/components/common/FileDownload';
import Link from 'frontend/components/common/Link';
import SvgDownloadApp from 'frontend/components/icons-new/DownloadApp';
import HotelCheckInPopup from 'frontend/components/renderings/ViewBooking/components/HotelCheckInPopup/HotelCheckInPopup';
import { IViewBookingFields } from 'frontend/components/renderings/ViewBooking/ViewBooking';

import ConfirmationPoster from './components/ConfirmationPoster';
import { ManageHubCTA } from './components/ManageHubCTA/ManageHubCTA';

import styles from './ViewBookingToolbar.module.scss';

export interface IViewBookingToolbarProps {
    booking: IBookingInfo;
    isBookingCanceled: boolean;
    isLeadLoggedIn: boolean;
    rendering: ComponentRendering;
    bookingPdfFileName?: string;
    bookingPdfLink?: string;
    fields?: IViewBookingFields;
}

/**Currently design of this component is the same as BookingToolbar rendering.
 * Future proof: when view booking pages will be restructured in terms of sitecore layout, then logic
 * from this component should be moved to rendering BookingToolbar which already exists. Until then we can't
 * move it there becasue of the complicated structure of ViewBooking component */
const ViewBookingToolbar: FC<IViewBookingToolbarProps> = ({
    booking,
    bookingPdfLink,
    bookingPdfFileName,
    isBookingCanceled,
    isLeadLoggedIn,
    rendering,
    fields,
}) => {
    const {
        getPhrase,
        getSetting,
        isTradePortal,
        isCheckInAvailable,
        fireViewBookingTrackingEvent,
        isHotelCheckInEnabled,
        isB2BAmendmentAllowed,
        isMicroAppManageMyHolidayAllowed,
        isBookingConfirmationPage,
        isPaymentReminderVisible,
    } = useStore((stores: TStores) => ({
        getPhrase: stores.layoutStore.getPhrase,
        getSetting: stores.layoutStore.getSetting,
        isTradePortal: stores.layoutStore.isTradePortal,
        isCheckInAvailable: stores.bookingStore.isCheckInAvailable,
        fireViewBookingTrackingEvent: isHolidayStore(stores) ? stores.trackingStore.fireViewBookingEvent : null,
        isHotelCheckInEnabled: stores.layoutStore.isHotelCheckInEnabled,
        isBookingConfirmationPage: stores.routerStore.isBookingConfirmationPage,
        isPaymentReminderVisible: isHolidayStore(stores) ? stores.bookingStore.isPaymentReminderVisible : null,
        isMicroAppManageMyHolidayAllowed: stores.viewBookingStore.isMicroAppManageMyHolidayAllowed,
        isB2BAmendmentAllowed: stores.viewBookingStore.isB2BAmendmentAllowed,
    }));
    const [isHotelCheckInPopupVisible, setIsHotelCheckInPopupVisible] = useState(false);

    const isMoreThenTabletViewport = useMoreThenTabletViewport();
    const routes = booking.package?.transport?.routes;
    const referenceNumber = booking.bookingReference;

    const checkInLink = getCheckInLink(booking, getSetting);
    const bookingPdfRequestData = getPdfRequestBody(booking);

    const fireTrackingDownloadEvent = (type: TravelDocsTypes) => () => {
        fireViewBookingTrackingEvent?.(ViewBookingTrackingEvents.TravelDocs, `Travel Docs-${type}`);
    };

    const isFileDownloadShown = !booking.isExternalAgency && bookingPdfLink && bookingPdfFileName;
    const isFlightCheckInShown = checkInLink && isCheckInAvailable(booking);
    const isCheckInButtonsShown = isFlightCheckInShown || isHotelCheckInEnabled;

    const isButtonsShown =
        !isBookingCanceled &&
        !isTradePortal &&
        (isCheckInButtonsShown || isFileDownloadShown || isMoreThenTabletViewport);

    const isPaymentReminderOnPage = isPaymentReminderVisible?.(booking);

    const isRenderHolidayCTA =
        ((isTradePortal && isB2BAmendmentAllowed) || (!isTradePortal && isMicroAppManageMyHolidayAllowed)) &&
        !isBookingConfirmationPage();
    const isManageButtonOutlinedB2C = !isLeadLoggedIn || isPaymentReminderOnPage;
    const isManageButtonOutlined = !isTradePortal && isManageButtonOutlinedB2C;

    return (
        <div className={styles.viewBookingToolbar}>
            <div className='wrapper-container wrapper-container--px'>
                <Placeholder name={PlaceholderNames.ToolbarTopSection} rendering={rendering} />

                <div className={styles.container}>
                    <BookingRefs
                        bookingRoutes={routes}
                        referenceNumber={referenceNumber}
                        hasTooltips
                        scrollToSeeFullReferences={fields?.ScrollToSeeFullReferences}
                    />
                    {isTradePortal && <ConfirmationPoster booking={booking} rendering={rendering} fields={fields} />}
                    {isButtonsShown && (
                        <div className={styles.buttonsWrapper} data-tid='toolbar-buttons'>
                            {isMoreThenTabletViewport && (
                                <PrintButton
                                    isText
                                    dataTid='print-btn-toolbar'
                                    onClick={fireTrackingDownloadEvent(TravelDocsTypes.PrintButton)}
                                    className={styles.transparentBtn}
                                />
                            )}
                            {isFileDownloadShown && (
                                <FileDownload
                                    fileName={bookingPdfFileName}
                                    fileType={FileType.Pdf}
                                    fileURL={bookingPdfLink}
                                    fileRequestData={bookingPdfRequestData}
                                    buttonDataTid='download-btn-toolbar'
                                    onClick={fireTrackingDownloadEvent(TravelDocsTypes.DownloadButton)}
                                    isText
                                    buttonClassName={classNames(styles.transparentBtn, styles.travelDocumentBtn)}
                                    showLoginPopup={!isLeadLoggedIn}
                                >
                                    <SvgDownloadApp />
                                    <span className='text-truncate'>
                                        {getPhrase(SitecoreDictionary.ViewBookingNavigationTravelDocuments)}
                                    </span>
                                </FileDownload>
                            )}

                            {isCheckInButtonsShown && (
                                <div className={styles.checkInBtns}>
                                    {isFlightCheckInShown && (
                                        <Link
                                            href={checkInLink}
                                            className={classNames(styles.borderedBtn, {
                                                [styles.orangeBtn]:
                                                    !isHotelCheckInEnabled &&
                                                    isRenderHolidayCTA &&
                                                    !isManageButtonOutlined,
                                            })}
                                            rel='noopener noreferrer'
                                            target='_blank'
                                            data-tid='check-in-link'
                                        >
                                            <span className='text-truncate'>
                                                {getPhrase(SitecoreDictionary.ViewBookingButtonsFlightCheckIn)}
                                            </span>
                                        </Link>
                                    )}
                                    {isHotelCheckInEnabled && (
                                        <Button
                                            dataTid='hotel-check-in-btn'
                                            className={classNames(
                                                styles.borderedBtn,
                                                !isFlightCheckInShown && styles.orangeBtn,
                                            )}
                                            isSecondary
                                            onClick={(): void => setIsHotelCheckInPopupVisible(true)}
                                        >
                                            {getPhrase(SitecoreDictionary.ViewBookingButtonsHotelCheckIn)}
                                        </Button>
                                    )}
                                </div>
                            )}
                        </div>
                    )}

                    {isRenderHolidayCTA && (
                        <ManageHubCTA
                            label={fields?.ManageHubLabel?.value}
                            buttonClass={isManageButtonOutlined ? styles.borderedBtn : undefined}
                        />
                    )}
                </div>
                {isHotelCheckInPopupVisible && (
                    <HotelCheckInPopup onClose={(): void => setIsHotelCheckInPopupVisible(false)} />
                )}
            </div>
        </div>
    );
};

export default ViewBookingToolbar;
