import React, { FC, useEffect } from 'react';
import { Placeholder } from '@sitecore-jss/sitecore-jss-nextjs';
import classNames from 'classnames';
import { observer } from 'mobx-react';

import useStore from 'frontend/hooks/useStore';
import { IHolidaysStores } from 'frontend/store/holidays';
import { TViewBookingsSortOrderItem } from 'frontend/store/holidays/viewBooking/ViewBookingsStore';
import { PlaceholderNames } from 'models/enum/PlaceholderNames';
import SitecoreDictionary from 'models/enum/SitecoreDictionary';
import { ISitecoreComponent } from 'models/sitecore/generic/ISitecoreComponent';
import { ISitecoreField, ISitecoreImage } from 'models/sitecore/generic/ISitecoreField';
import Button from 'frontend/components/common/Button';
import IconChevronRight from 'frontend/components/icons/ChevronRight';

import AddBookingCTA from './components/AddBookingCTA';
import AddBookingPopup from './components/AddBookingPopup/AddBookingPopup';
import BookingsList from './components/BookingsList/BookingsList';
import CreditComponent from './components/CreditComponent/CreditComponent';
import NoBookings from './components/NoBookings';
import ViewBookingsBanner from './components/ViewBookingsBanner';

import styles from './ViewBookings.module.scss';

type TViewBookingsProps = ISitecoreComponent<IViewBookingsSitecoreFields, IViewBookingsSitecoreParams>;

export interface IViewBookingsSitecoreFields {
    AddBookingCTAText: ISitecoreField<string>;
    BookingAddedSuccess: ISitecoreField<string>;
    BookingsSortDefault: TViewBookingsSortOrderItem;
    BookingsSortOrder: TViewBookingsSortOrderItem[];
    CancelledBookingsSortOrder: TViewBookingsSortOrderItem[];
    FlightHotelPillIcon: ISitecoreField<ISitecoreImage>;
    FlightHotelPillText: ISitecoreField<string>;
    IsAddBookingCTAShown: ISitecoreField<boolean>;
    IsNoBookingsButtonHidden: ISitecoreField<boolean>;
    MultipleCreditsInfo: ISitecoreField<string>;
    NoBookingsDescription: ISitecoreField<string>;
    NoBookingsTitle: ISitecoreField<string>;
    RegularPillIcon: ISitecoreField<ISitecoreImage>;
    TradeBookingAddingError: ISitecoreField<string>;
}

export interface IViewBookingsSitecoreParams {
    BackgroundImage: string;
}

const ViewBookings: FC<TViewBookingsProps> = ({ fields, rendering, params }) => {
    const {
        initialize,
        bookingsRequest,
        hasNoBookings,
        getPhrase,
        cancelFetchBookings,
        isLoggedIn,
        toggleAddBooking,
        isAddBookingShown,
        isCreditBookingEnabled,
        areBookingsLoading,
    } = useStore((stores: IHolidaysStores) => ({
        initialize: stores.viewBookingsStore.initialize,
        bookingsRequest: stores.viewBookingsStore.bookingsRequest,
        hasNoBookings: stores.viewBookingsStore.hasNoBookings,
        getPhrase: stores.layoutStore.getPhrase,
        cancelFetchBookings: stores.viewBookingsStore.cancelFetchBookings,
        isLoggedIn: stores.userStore.isLoggedIn,
        toggleAddBooking: stores.addBookingStore.toggleAddBooking,
        isAddBookingShown: stores.addBookingStore.isAddBookingShown,
        isCreditBookingEnabled: stores.holidayCreditStore.isCreditBookingEnabled,
        areBookingsLoading: stores.viewBookingsStore.areBookingsLoading,
    }));

    useEffect(() => {
        if (fields) initialize(fields);

        return () => {
            cancelFetchBookings();
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    if (!isLoggedIn) {
        return null;
    }

    return (
        <>
            <div className={styles.bookingsContainer}>
                <ViewBookingsBanner
                    imageUrl={params?.BackgroundImage}
                    isTriangleGrey={
                        bookingsRequest?.isFinished && !hasNoBookings && !!fields?.IsAddBookingCTAShown?.value
                    }
                />
                {areBookingsLoading && (
                    <div className='wrapper-component-container__inner'>
                        <div className={classNames(styles.placeholderAnchors, 'placeholder-shimmer')} />
                        <div className={classNames(styles.placeholderCard, 'placeholder-shimmer')} />
                        <div className={classNames(styles.placeholderCard, 'placeholder-shimmer')} />
                    </div>
                )}
                {!areBookingsLoading && isCreditBookingEnabled ? (
                    <div className='wrapper-component-container'>
                        <div className='wrapper-component-container__inner'>
                            <div className={styles.wrapper}>
                                <div
                                    data-tid='add-booking-card'
                                    className={classNames(styles.item, styles.addBookingCard)}
                                >
                                    <h4 className={styles.itemTitle}>
                                        {getPhrase(SitecoreDictionary.ViewBookingsTitlesAddBookingCard)}
                                        <IconChevronRight />
                                    </h4>
                                    <p className={styles.itemDescription}>
                                        {getPhrase(SitecoreDictionary.ViewBookingsLabelsAddBookingCard)}
                                    </p>{' '}
                                    <Button
                                        onClick={toggleAddBooking}
                                        isOutlined
                                        className={styles.itemButton}
                                        isFullWidth
                                        data-tid='add-booking-card-btn'
                                    >
                                        {getPhrase(SitecoreDictionary.ViewBookingsButtonsAddBooking)}
                                    </Button>
                                </div>
                                <CreditComponent MultipleCreditsInfo={fields?.MultipleCreditsInfo} />

                                <Placeholder
                                    name={PlaceholderNames.CreditExpiresBanner}
                                    rendering={rendering}
                                    className={styles.creditBanner}
                                    data-tid='credit-expires-banner-placeholder'
                                />

                                <BookingsList
                                    rendering={rendering}
                                    FlightHotelPillIcon={fields?.FlightHotelPillIcon}
                                    FlightHotelPillText={fields?.FlightHotelPillText}
                                    RegularPillIcon={fields?.RegularPillIcon}
                                />
                            </div>
                        </div>
                    </div>
                ) : (
                    fields?.IsAddBookingCTAShown?.value && (
                        <>
                            <AddBookingCTA getPhrase={getPhrase} toggleAddBooking={toggleAddBooking} fields={fields} />
                            <div className='wrapper-component-container'>
                                <div className='wrapper-component-container__inner'>
                                    <BookingsList
                                        rendering={rendering}
                                        FlightHotelPillIcon={fields?.FlightHotelPillIcon}
                                        FlightHotelPillText={fields?.FlightHotelPillText}
                                        RegularPillIcon={fields?.RegularPillIcon}
                                    />
                                </div>
                            </div>
                        </>
                    )
                )}
                {hasNoBookings && !isCreditBookingEnabled && (
                    <NoBookings
                        getPhrase={getPhrase}
                        rendering={rendering}
                        fields={fields}
                        onAddBooking={toggleAddBooking}
                    />
                )}
            </div>
            {isAddBookingShown && <AddBookingPopup onClose={toggleAddBooking} fields={fields} rendering={rendering} />}
        </>
    );
};

export default observer(ViewBookings);
