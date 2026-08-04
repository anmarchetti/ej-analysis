import { webApiUrls } from 'code/endpoints';
import AxiosRequest from 'frontend/utils/request';
import { IGeoPoints, IPolyBounds } from 'models/data/map/IMap';

import { logger } from './logging';

let controller: AbortController | null = null;

export class HotelsService {
    static readonly fetchDestinationHotels = async (code: string): Promise<IGeoPoints> => {
        try {
            const result = await AxiosRequest.get(webApiUrls.destinationHotelsSummary(code));

            return result.data;
        } catch (e) {
            if (e instanceof Error) {
                logger.error({ e });
            }

            throw e;
        }
    };

    static readonly fetchPolygonHotels = async (poly: IPolyBounds): Promise<IGeoPoints> => {
        if (controller) {
            controller.abort();
        }

        controller = new AbortController();

        try {
            const result = await AxiosRequest.post(
                webApiUrls.polygonDestinationHotelsSummary(),
                {
                    topLeftAngle: {
                        latitude: +poly.lt1,
                        longitude: +poly.ln1,
                    },
                    bottomRightAngle: {
                        latitude: +poly.lt2,
                        longitude: +poly.ln2,
                    },
                },
                {
                    signal: controller.signal,
                },
            );

            return result.data;
        } catch (e) {
            if (e instanceof Error) {
                logger.error({ e });
            }

            throw e;
        }
    };
}
