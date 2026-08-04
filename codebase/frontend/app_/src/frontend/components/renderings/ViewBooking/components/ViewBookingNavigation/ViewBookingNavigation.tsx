import React, { FC, useMemo, useRef } from 'react';
import classNames from 'classnames';

import { useAnchorScrollTracker } from 'frontend/hooks/useAnchorScrollTracker';
import useStore from 'frontend/hooks/useStore';
import { isHolidayStore } from 'frontend/store/holidays';
import { TravelDocsTypes, ViewBookingTrackingEvents } from 'frontend/utils/tracking/viewBooking.utils';
import { scrollToElement } from 'frontend/utils/ui.utils';
import { getPdfRequestBody } from 'frontend/utils/viewBooking.utils';
import { IBookingInfo } from 'models/data/IBookingInfo';
import { FileType } from 'models/enum/FileType';
import SitecoreDictionary from 'models/enum/SitecoreDictionary';
import PrintButton from 'frontend/components/common/Booking/Header/PrintButton';
import FileDownload from 'frontend/components/common/FileDownload';
import StickyBox from 'frontend/components/common/StickyBox';
import TruncatedTooltip from 'frontend/components/common/TruncatedTooltip/index';
import SvgBeach from 'frontend/components/icons-new/Beach';
import SvgDownloadApp from 'frontend/components/icons-new/DownloadApp';
import SvgHotelBedFilled from 'frontend/components/icons-new/HotelBedFilled';
import SvgInsuranceFilled from 'frontend/components/icons-new/InsuranceFilled';
import SvgPaymentsFilled from 'frontend/components/icons-new/PaymentsFilled';

import styles from './ViewBookingNavigation.module.scss';

interface IViewBookingAnchor {
    anchorId: string;
    dictionary: SitecoreDictionary;
    icon: JSX.Element;
}

export const ViewBookingAnchors: Record<string, IViewBookingAnchor> = {
    HolidaySummary: {
        icon: <SvgHotelBedFilled />,
        dictionary: SitecoreDictionary.ViewBookingNavigationHolidaySummary,
        anchorId: 'holiday-summary',
    },
    HolidayDetails: {
        icon: <SvgBeach />,
        dictionary: SitecoreDictionary.ViewBookingNavigationHolidayDetails,
        anchorId: 'holiday-details',
    },
    HolidayCost: {
        icon: <SvgPaymentsFilled />,
        dictionary: SitecoreDictionary.ViewBookingNavigationHolidayCost,
        anchorId: 'holiday-cost',
    },
    HealthEntryRequirements: {
        icon: <SvgInsuranceFilled />,
        dictionary: SitecoreDictionary.ViewBookingHealthEntryRequirements,
        anchorId: 'health-entry-requirements',
    },
};

export const ViewBookingFHAnchors: Record<string, IViewBookingAnchor> = {
    HolidaySummary: {
        ...ViewBookingAnchors.HolidaySummary,
        dictionary: SitecoreDictionary.ViewBookingNavigationBookingSummary,
    },
    HolidayDetails: {
        ...ViewBookingAnchors.HolidayDetails,
        dictionary: SitecoreDictionary.ViewBookingNavigationBookingDetails,
    },
    HolidayCost: { ...ViewBookingAnchors.HolidayCost, dictionary: SitecoreDictionary.ViewBookingNavigationBookingCost },
    HealthEntryRequirements: ViewBookingAnchors.HealthEntryRequirements,
};

// Offset value that adjusts to determine the elements are in the viewport
const OFFSET = 20;

export interface IBookingNavigationProps {
    booking: IBookingInfo;
    bookingPdfFileName: string;
    bookingPdfLink: string;
    isLeadLoggedIn: boolean;
    showRemainingBalance: boolean;
}

const ViewBookingNavigation: FC<IBookingNavigationProps> = ({
    booking,
    bookingPdfLink,
    bookingPdfFileName,
    isLeadLoggedIn,
    showRemainingBalance,
}) => {
    const { getPhrase, fireViewBookingTrackingEvent, isFlightAndHotelPackage } = useStore(stores => ({
        getPhrase: stores.layoutStore.getPhrase,
        fireViewBookingTrackingEvent: isHolidayStore(stores) ? stores.trackingStore.fireViewBookingEvent : null,
        isFlightAndHotelPackage:
            isHolidayStore(stores) &&
            (stores.viewBookingStore.isFlightAndHotelPackage || stores.bookingStore.isFlightAndHotelPackage),
    }));

    const anchors = useMemo(() => {
        const Anchors = isFlightAndHotelPackage ? ViewBookingFHAnchors : ViewBookingAnchors;
        let anchors = [Anchors.HolidaySummary];

        if (booking.isExternalAgency) {
            anchors.push(Anchors.HolidayDetails);
        } else if (showRemainingBalance) {
            anchors = anchors.concat([Anchors.HolidayCost, Anchors.HolidayDetails]);
        } else {
            anchors = anchors.concat([Anchors.HolidayDetails, Anchors.HolidayCost]);
        }

        if (booking.healthEntryRequirements?.length) {
            anchors.push(Anchors.HealthEntryRequirements);
        }

        return anchors;
    }, [booking, showRemainingBalance, isFlightAndHotelPackage]);

    const pageNavRef = useRef<HTMLDivElement | null>(null);

    const additionalOffset = (pageNavRef?.current?.offsetHeight || 0) + OFFSET;

    const anchorTrackerItems = useMemo(() => anchors.map(item => ({ id: item.anchorId })), [anchors]);
    const anchorsStates = useAnchorScrollTracker({ items: anchorTrackerItems, baseOffset: OFFSET });
    const activeAnchorId = anchorsStates.find(item => item.isActive)?.id;

    const onAnchorClick = (e: React.MouseEvent<HTMLAnchorElement, MouseEvent>, anchorId: string): void => {
        e.preventDefault();
        const target = document.getElementById(anchorId);

        target && scrollToElement(target, additionalOffset);
    };

    const onTravelDocClick = (type: TravelDocsTypes) => () => {
        fireViewBookingTrackingEvent?.(ViewBookingTrackingEvents.TravelDocs, `Travel Docs-${type}`);
    };

    const bookingPdfRequestData = getPdfRequestBody(booking);

    return (
        <StickyBox
            render={(): JSX.Element => (
                <nav className={styles.navBar} ref={pageNavRef} id='page-nav'>
                    <div className='wrapper-container wrapper-container--px'>
                        <ul className={styles.list}>
                            {anchors.map((anchor, index) => (
                                <li key={anchor.anchorId}>
                                    <a
                                        href={`#${anchor.anchorId}`}
                                        className={classNames(styles.link, {
                                            [styles.linkActive]: activeAnchorId === anchor.anchorId,
                                        })}
                                        onClick={(e): void => onAnchorClick(e, anchor.anchorId)}
                                        data-tid={`${anchor.anchorId}-link`}
                                    >
                                        {anchor.icon}
                                        <TruncatedTooltip
                                            className={styles.linkText}
                                            text={getPhrase(anchor.dictionary)}
                                            id={`${anchor.anchorId}_${index}`}
                                        />
                                    </a>
                                </li>
                            ))}
                        </ul>

                        <div className={styles.extra}>
                            {isLeadLoggedIn && (
                                <TruncatedTooltip
                                    text={getPhrase(SitecoreDictionary.ViewBookingNavigationTravelDocuments)}
                                    id='page-nav__extra-label'
                                    className={styles.extraLabel}
                                />
                            )}

                            <PrintButton
                                isTransparent
                                className={styles.transparentBtn}
                                isLabelHidden
                                dataTid='print-btn-nav-bar'
                                onClick={onTravelDocClick(TravelDocsTypes.PrintIcon)}
                            />

                            {!booking.isExternalAgency && (
                                <FileDownload
                                    fileName={bookingPdfFileName}
                                    fileType={FileType.Pdf}
                                    fileURL={bookingPdfLink}
                                    fileRequestData={bookingPdfRequestData}
                                    buttonClassName={styles.transparentBtn}
                                    isTransparent
                                    buttonDataTid='download-btn-nav-bar'
                                    onClick={onTravelDocClick(TravelDocsTypes.DownloadIcon)}
                                    ariaLabel={getPhrase(
                                        SitecoreDictionary.BookingSummaryButtonsDownloadTravelDocuments,
                                    )}
                                    showLoginPopup={!isLeadLoggedIn}
                                >
                                    <SvgDownloadApp />
                                </FileDownload>
                            )}
                        </div>
                    </div>
                </nav>
            )}
        />
    );
};

export default ViewBookingNavigation;
