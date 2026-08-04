import { CancelTokenSource } from 'axios';

import { webApiUrls } from 'code/endpoints';
import { formatDateToQuery } from 'frontend/utils/date.utils';
import AxiosRequest from 'frontend/utils/request';
import { IAlternativeOffers } from 'models/data/IAlternativeOffers';
import { ITimeSlot } from 'models/data/ITimeSlot';
import { IQueryRoom } from 'models/data/URLQueryRooms';

class PriceGraphService {
    public loadAlternativeOffers = async (
        startDate: Date,
        initialDate: Date,
        flexDays: number,
        duration: number,
        departure: string,
        roomAllocation: IQueryRoom[],
        accommodationIds: string,
        boardType: string,
        outboundDepTime: ITimeSlot[],
        inboundDepTime: ITimeSlot[],
        isCheapestRoom?: boolean,
        cancelSource?: CancelTokenSource,
    ): Promise<IAlternativeOffers> => {
        const url = webApiUrls.getPriceGraphDates(
            formatDateToQuery(startDate),
            formatDateToQuery(initialDate),
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

        const result = await AxiosRequest.get(url, { cancelToken: cancelSource?.token });

        return result.data;
    };
}

export default new PriceGraphService();
