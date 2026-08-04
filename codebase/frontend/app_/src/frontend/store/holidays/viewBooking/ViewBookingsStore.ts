import Axios, { AxiosResponse } from 'axios';
import { action, computed, makeObservable, observable, runInAction } from 'mobx';

import bookingService from 'frontend/services/booking.service';
import sitecoreService from 'frontend/services/sitecore.service';
import { HolidaysRootStore } from 'frontend/store/holidays/HolidaysRootStore';
import { compareDates } from 'frontend/utils/date.utils';
import {
    IObservablePromise,
    observableFromPromise,
} from 'frontend/utils/observerablePromise/observerablePromise.utils';
import { getSelectValueFromSortOrder } from 'frontend/utils/sort.utils';
import { getWebStorageItem, removeWebStorageItem } from 'frontend/utils/webStorage.utils';
import { IApolloBookingItem } from 'models/data/IApolloBooking';
import { IBookingInfo, IBookingInfoPayload } from 'models/data/IBookingInfo';
import { ISelectOption } from 'models/data/ISelectOption';
import { BookingStatus } from 'models/enum/BookingStatus';
import HttpStatusCodes from 'models/enum/HttpStatusCodes';
import { QueryParamName } from 'models/enum/QueryParamName';
import { WebStorageKeys } from 'models/enum/WebStorageKeys';
import { ISortOrderItem } from 'models/sitecore/ISortOrderItem';
import { IViewBookingsSitecoreFields } from 'frontend/components/renderings/ViewBookings/ViewBookings';

export enum BookingsTabs {
    Upcoming = 'Upcoming',
    Previous = 'Previous',
    Canceled = 'Canceled',
}

export enum ViewBookingsSortBy {
    BookingDate = 'BOOKINGDATE',
    DepartureDate = 'DEPARTUREDATE',
    CancellationDate = 'CANCELLATIONDATE',
}

export type TViewBookingsSortOrderItem = ISortOrderItem<ViewBookingsSortBy>;

export class ViewBookingsStore {
    @observable hasNoBookings = false;
    @observable bookingsRequest: Nullable<IObservablePromise<AxiosResponse<IBookingInfo[]>>>;
    @observable.ref upcomingBookings: any[] = [];
    @observable.ref previousBookings: any[] = [];
    @observable.ref canceledBookings: any[] = [];
    @observable.ref bookings: any;
    @observable.ref sortBy: ISelectOption;
    @observable.ref isSortByDisabled = false;
    @observable.ref sortOptions: ISelectOption[] = [];
    @observable.ref defaultSortBy: ISelectOption;
    @observable.ref cancelledBookingsSortOptions: ISelectOption[] = [];
    @observable.ref availableSortOptions: ISelectOption[] = [];
    @observable areBookingsLoading = true;

    @observable activeTab?: BookingsTabs;

    @observable apolloBookings: IApolloBookingItem[] = [];
    @observable upcomingHotelImagePath: Nullable<string> = null;

    constructor(public rootStore: HolidaysRootStore) {
        makeObservable(this);
    }

    @computed get upcomingCount(): number {
        return this.upcomingBookings?.length ?? 0;
    }

    @computed get previousCount(): number {
        return this.previousBookings?.length ?? 0;
    }

    @computed get canceledCount(): number {
        return this.canceledBookings?.length ?? 0;
    }

    @computed get apolloUpcomingBooking(): IApolloBookingItem | null {
        if (this.apolloBookings.length === 0) {
            return null;
        }

        const now = new Date();

        const futureBookings = this.apolloBookings.filter(booking => {
            const holidayStartDate = new Date(booking.holidayDateStartLocal);

            return holidayStartDate > now;
        });

        if (futureBookings.length === 0) {
            return null;
        }

        const sortedBookings = [...futureBookings].sort((a, b) =>
            compareDates(a.holidayDateStartLocal, b.holidayDateStartLocal),
        );

        return sortedBookings[0];
    }

    @action initialize = async (fields: IViewBookingsSitecoreFields): Promise<void> => {
        // if user is not logged in redirect to login page
        const isLoggedIn = await this.rootStore.userStore.checkIfUserLoggedIn();
        const shouldReturnToMyBookings = this.rootStore.queryParamsStore.firebaseSource;
        const redirectParams =
            shouldReturnToMyBookings &&
            this.rootStore.queryParamsStore.buildQuery({ [QueryParamName.MyBookings]: '1' });

        if (!isLoggedIn) {
            this.rootStore.routerStore.redirectToLoginPage(!shouldReturnToMyBookings, redirectParams);

            return;
        }

        try {
            if (fields?.BookingsSortOrder) {
                this.setSortByOptions(fields.BookingsSortOrder?.map(getSelectValueFromSortOrder));
            }

            if (fields?.BookingsSortDefault) {
                this.setDefaultSortBy(getSelectValueFromSortOrder(fields.BookingsSortDefault));
                this.setSortByToDefault();
            }

            if (fields?.CancelledBookingsSortOrder) {
                this.cancelledBookingsSortOptions = fields.CancelledBookingsSortOrder?.map(getSelectValueFromSortOrder);
            }

            await Promise.all([
                this.fetchBookings(),
                this.rootStore.holidayCreditStore.fetchMyCreditBalance(true, true),
            ]);
        } catch (e) {
            // if we got unauthorized error, it means that user is not logged in, then we should redirect him to login page
            // this is required when user has many tabs and logs out in one of them
            if (e.response?.status === HttpStatusCodes.Unauthorized) {
                await this.rootStore.userStore.onLogout(true);
                this.rootStore.routerStore.redirectToLoginPage(!shouldReturnToMyBookings, redirectParams);
            }
        }
    };

    @action setSortByOptions = (sortOptions: Nullable<ISelectOption[]>): void => {
        this.sortOptions = sortOptions || [];
    };

    @action setSortBy = (sortBy: ISelectOption): void => {
        this.sortBy = sortBy;
        this.sortBookings(sortBy);
    };

    @action setDefaultSortBy = (sortBy: ISelectOption): void => {
        this.defaultSortBy = sortBy;
    };

    @action setSortByToDefault = (): void => {
        this.setSortBy(this.defaultSortBy);
    };

    @action fetchBookings = async (): Promise<void> => {
        this.areBookingsLoading = true;
        this.hasNoBookings = false;
        this.clearStore();

        try {
            if (this.bookingsRequest?.isPending) {
                this.bookingsRequest.cancel();
            }

            this.bookingsRequest = observableFromPromise(ct => bookingService.fetchBookings(ct));

            await this.bookingsRequest;

            const fetchedBookings = this.bookingsRequest?.value?.data || [];
            const latestConfirmedBooking: Nullable<IBookingInfoPayload> = getWebStorageItem(
                WebStorageKeys.LatestConfirmedBooking,
                true,
                sessionStorage,
            );

            try {
                const isLatestConfirmedBookingFetched = fetchedBookings.some(
                    (b: IBookingInfo) => b.bookingReference === latestConfirmedBooking?.bookingReference,
                );

                if (!isLatestConfirmedBookingFetched && latestConfirmedBooking) {
                    const { date, bookingReference, lastName } = latestConfirmedBooking;
                    const result = await bookingService.viewBooking(date, bookingReference, lastName);

                    if (result?.data) {
                        fetchedBookings.push(result.data);
                    }
                } else {
                    removeWebStorageItem(WebStorageKeys.LatestConfirmedBooking, sessionStorage);
                }
            } catch {}

            runInAction(() => {
                if (!fetchedBookings.length) {
                    this.hasNoBookings = true;

                    return;
                }

                const today = new Date();

                const upcoming = [] as any[];
                const previous = [] as any[];
                const canceled = [] as any[];

                fetchedBookings.forEach(b => {
                    const returnDate = b.package?.transport?.routes?.[1]?.depDate;

                    /** Holiday should be in the "upcoming" list until the date of the return flight */
                    /** Canceled bookings should be separated from "upcoming"/"previous bookings" */
                    if (b.bookingStatus === BookingStatus.Canceled) {
                        canceled.push(b);
                    } else if (!returnDate || today.getTime() <= new Date(returnDate).getTime()) {
                        upcoming.push(b);
                    } else {
                        previous.push(b);
                    }
                });

                this.sortBookings(this.sortBy, upcoming, previous, canceled);

                if (this.upcomingBookings.length > 0) {
                    this.onTabChange(BookingsTabs.Upcoming);
                } else if (this.previousBookings.length > 0) {
                    this.onTabChange(BookingsTabs.Previous);
                } else {
                    this.onTabChange(BookingsTabs.Canceled);
                }
            });
        } catch (e) {
            if (Axios.isCancel(e)) {
                return;
            }

            runInAction(() => (this.hasNoBookings = true));

            throw e;
        } finally {
            runInAction(() => {
                this.areBookingsLoading = false;
            });
        }
    };

    @action fetchBookingsFromApollo = async (): Promise<void> => {
        if (!this.rootStore.userStore.isLoggedIn) {
            return;
        }

        try {
            const response = await bookingService.fetchBookingsFromApollo();

            runInAction(() => {
                this.apolloBookings = response.data?.bookings || [];
            });
        } catch {
            runInAction(() => {
                this.apolloBookings = [];
            });
        }
    };

    @action clearApolloBookings = (): void => {
        this.apolloBookings = [];
        this.upcomingHotelImagePath = null;
    };

    @action fetchUpcomingHotelImage = async (hotelCode: string, resortCode: string): Promise<void> => {
        try {
            const imagePath = await sitecoreService.getHotelImage(hotelCode, resortCode);

            runInAction(() => {
                this.upcomingHotelImagePath = imagePath;
            });
        } catch {
            runInAction(() => {
                this.upcomingHotelImagePath = null;
            });
        }
    };

    @action sortBookings = (
        sortBy: Nullable<ISelectOption>,
        upcomingBookings = this.upcomingBookings,
        previousBookings = this.previousBookings,
        canceledBookings = this.canceledBookings,
    ): void => {
        if (sortBy?.value === ViewBookingsSortBy.DepartureDate) {
            this.upcomingBookings = upcomingBookings.sort(this.descendingDepartureComparer);
            this.previousBookings = previousBookings.sort(this.descendingDepartureComparer);
            this.canceledBookings = canceledBookings.sort(this.descendingDepartureComparer);
        } else if (sortBy?.value === ViewBookingsSortBy.BookingDate) {
            this.upcomingBookings = upcomingBookings.sort(this.descendingBookingDateComparer);
            this.previousBookings = previousBookings.sort(this.descendingBookingDateComparer);
            this.canceledBookings = canceledBookings.sort(this.descendingBookingDateComparer);
        } else if (sortBy?.value === ViewBookingsSortBy.CancellationDate) {
            this.upcomingBookings = upcomingBookings;
            this.previousBookings = previousBookings;
            this.canceledBookings = canceledBookings.sort(this.descendingCancellationDateComparer);
        } else {
            this.upcomingBookings = upcomingBookings;
            this.previousBookings = previousBookings;
            this.canceledBookings = canceledBookings;
        }
    };

    @action clearStore = (): void => {
        this.bookings = undefined;
        this.upcomingBookings = [];
        this.previousBookings = [];
        this.canceledBookings = [];
        this.activeTab = undefined;
    };

    @action handleSortByChange = (bookingsType: BookingsTabs): void => {
        if (bookingsType === BookingsTabs.Upcoming || bookingsType === BookingsTabs.Previous) {
            this.availableSortOptions = this.sortOptions;

            if (!this.availableSortOptions.includes(this.sortBy)) {
                this.setSortByToDefault();
            }

            return;
        }

        if (bookingsType === BookingsTabs.Canceled) {
            this.availableSortOptions = this.cancelledBookingsSortOptions;
            this.setSortBy(
                this.availableSortOptions?.find(
                    el => el.value === ViewBookingsSortBy.CancellationDate,
                ) as ISelectOption,
            );
        }
    };

    @action onTabChange = (tabName: BookingsTabs): void => {
        if (tabName === this.activeTab) {
            return;
        }

        this.activeTab = tabName;

        this.handleSortByChange(tabName);

        switch (tabName) {
            case BookingsTabs.Upcoming:
                this.bookings = this.upcomingBookings;
                break;
            case BookingsTabs.Previous:
                this.bookings = this.previousBookings;
                break;
            case BookingsTabs.Canceled:
                this.bookings = this.canceledBookings;
                break;
            default:
                return;
        }

        if (this.bookings.length <= 1 || this.availableSortOptions.length <= 1) {
            this.isSortByDisabled = true;
        } else {
            this.isSortByDisabled = false;
        }
    };

    cancelFetchBookings = (): void => {
        if (this.bookingsRequest?.isPending) {
            this.bookingsRequest.cancel();
        }
    };

    private descendingDepartureComparer = (a, b): number => {
        const startDateA = new Date(a.package?.accom?.startDate);
        const startDateB = new Date(b.package?.accom?.startDate);

        return startDateA.getTime() - startDateB.getTime();
    };

    private descendingBookingDateComparer = (a, b): number => {
        const bookingDateA = new Date(a.bookingDate);
        const bookingDateB = new Date(b.bookingDate);

        return bookingDateA.getTime() - bookingDateB.getTime();
    };

    private descendingCancellationDateComparer = (a, b): number => {
        const cancellationDateA = new Date(a.cancellationDate);
        const cancellationDateB = new Date(b.cancellationDate);

        return cancellationDateB.getTime() - cancellationDateA.getTime();
    };

    isPreviousBooking = (booking?: IBookingInfo): boolean => {
        if (booking && this.previousBookings.length) {
            return this.previousBookings.some(el => el.bookingReference === booking.bookingReference);
        }

        return false;
    };
}
