import { createContext } from 'react';

import { IBookingInfo } from 'models/data/IBookingInfo';

export const BookingContext = createContext({ booking: {} as Nullable<IBookingInfo> });
