import { webApiUrls } from 'code/endpoints';
import { formatDateToQuery } from 'frontend/utils/date.utils';
import AxiosRequest from 'frontend/utils/request';
import { IAlternativeOffers } from 'models/data/IAlternativeOffers';
import { ITimeSlot } from 'models/data/ITimeSlot';
import { IQueryRoom } from 'models/data/URLQueryRooms';

class ComparePricesCalendarService {
    public loadAlternativeOffers = async (
        startDate: Date,
        start: Date,
        end: Date,
        flexDays: number,
        duration: number,
        departure: string,
        roomAllocation: IQueryRoom[],
        accommodationIds: string,
        boardType: string,
        outboundDepTime: ITimeSlot[],
        inboundDepTime: ITimeSlot[],
        isCheapestRoom: boolean,
    ): Promise<IAlternativeOffers> => {
        const url = webApiUrls.getPricesForCompareCalendar(
            formatDateToQuery(startDate),
            formatDateToQuery(start),
            formatDateToQuery(end),
            flexDays,
            duration,
            departure,
            roomAllocation,
            accommodationIds,
            boardType && encodeURIComponent(boardType),
            outboundDepTime,
            inboundDepTime,
            isCheapestRoom,
        );

        const result = await AxiosRequest.get(url);

        return result.data;
    };
}

export default new ComparePricesCalendarService();
