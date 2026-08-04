import { webApiUrls } from 'code/endpoints';
import { logger } from 'frontend/services/logging';
import AxiosRequest from 'frontend/utils/request';
import { ApiError } from 'models/data/ApiError';
import { IAirportParking } from 'models/data/externalExtras/IAirportParking';
import { IOfferWithoutAltBoards } from 'models/data/IOffer';

export class AirportParkingService {
    public static readonly getAirportParkings = async (
        selectedOffer: IOfferWithoutAltBoards,
    ): Promise<IAirportParking[]> => {
        try {
            const result = await AxiosRequest.post(webApiUrls.getAirportParking(), {
                offer: selectedOffer,
            });

            return result.data.airportParkingItems;
        } catch (e) {
            if (e instanceof Error) {
                logger.error({ e });
            }

            throw new ApiError(e);
        }
    };
}
