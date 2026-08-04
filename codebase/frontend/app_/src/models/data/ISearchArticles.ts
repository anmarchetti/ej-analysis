import { IArticle } from './IArticle';
import { IFilterOption } from './IFilters';

export interface ISearchArticlesParams {
    endDate?: string;
    offset?: number;
    page?: number;
    startDate?: string;
    take?: number;
    topics?: Nullable<string[]>;
}

export interface ISearchArticles {
    articles: IArticle[];
    topicsFilter: IFilterOption[];
    total: number;
}
