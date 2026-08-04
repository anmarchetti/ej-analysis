import { FC, useMemo } from 'react';
import { Placeholder } from '@sitecore-jss/sitecore-jss-nextjs';
import { observer } from 'mobx-react';

import { BookingContext } from 'frontend/context/BookingContext';
import useStore from 'frontend/hooks/useStore';
import { useViewBookingPageInit } from 'frontend/hooks/viewBooking.hooks';
import { IHolidaysStores } from 'frontend/store/holidays';
import { PlaceholderNames } from 'models/enum/PlaceholderNames';
import { ISitecoreComponent } from 'models/sitecore/generic/ISitecoreComponent';
import { ISitecoreField } from 'models/sitecore/generic/ISitecoreField';
import OverlaySpinner from 'frontend/components/common/OverlaySpinner';

type TBookingContextProviderFields = {
    SpinnerDescription: ISitecoreField<string>;
    SpinnerTitle: ISitecoreField<string>;
};

export const BookingContextProvider: FC<ISitecoreComponent<TBookingContextProviderFields>> = ({
    rendering,
    fields,
}) => {
    const { isCancelledBookingPage } = useStore(({ layoutStore }: IHolidaysStores) => ({
        isCancelledBookingPage: layoutStore.isCancelledBookingPage,
    }));

    const { booking, isLoading } = useViewBookingPageInit(!isCancelledBookingPage);

    const bookingContextValue = useMemo(() => ({ booking }), [booking]);

    if (isLoading && fields) {
        return <OverlaySpinner header={fields.SpinnerTitle?.value} description={fields.SpinnerDescription?.value} />;
    }

    if (!booking || !rendering) {
        return null;
    }

    return (
        <BookingContext.Provider value={bookingContextValue}>
            <Placeholder name={PlaceholderNames.BookingContext} rendering={rendering} />
        </BookingContext.Provider>
    );
};

export default observer(BookingContextProvider);
