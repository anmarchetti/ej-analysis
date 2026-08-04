import { webApiUrls } from 'code/endpoints';
import AxiosRequest from 'frontend/utils/request';
import { IFilterOption } from 'models/data/IFilters';
import { ISearchArticles, ISearchArticlesParams } from 'models/data/ISearchArticles';

import logger from './logging/logger.service';

class MediaCenterService {
    /**
     * Fetches articles
     */
    public fetchArticles = async (params: ISearchArticlesParams): Promise<ISearchArticles> => {
        const { take, page, topics, startDate, endDate, offset } = params;
        try {
            const url = webApiUrls.getArticles();
            const result = await AxiosRequest.post(url, {
                take,
                page,
                topics,
                offset,
                // date filter is out scope
                startDate: startDate,
                endDate: endDate,
            });

            // sitecore filter options have no code
            result.data.topicsFilter.forEach((topic: IFilterOption) => {
                topic.code = topic.name;
            });

            return result.data;
        } catch (e) {
            if (e instanceof Error) {
                logger.error({ e });
            }

            throw e;
        }
    };
}

export default new MediaCenterService();
