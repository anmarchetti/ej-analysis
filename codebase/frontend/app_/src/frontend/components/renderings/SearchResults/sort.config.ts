import { OrderBy } from 'models/enum/OrderBy';
import { OrderDirection } from 'models/enum/OrderDirection';

export interface ISortConfig {
    code: string;
    orderBy: OrderBy;
    orderDirection: OrderDirection;
}

export const sortConfig = [
    {
        code: 'RMD',
        orderBy: OrderBy.Recommended,
        orderDirection: OrderDirection.Default,
    },
    {
        code: 'PLTH',
        orderBy: OrderBy.Price,
        orderDirection: OrderDirection.Asc,
    },
    {
        code: 'PHTL',
        orderBy: OrderBy.Price,
        orderDirection: OrderDirection.Desc,
    },
    {
        code: 'DAPOUNDS',
        orderBy: OrderBy.DiscAmount,
        orderDirection: OrderDirection.Desc,
    },
    {
        code: 'DAPERCENTS',
        orderBy: OrderBy.DiscPercent,
        orderDirection: OrderDirection.Desc,
    },
    {
        code: 'TA',
        orderBy: OrderBy.TripAdvisor,
        orderDirection: OrderDirection.Desc,
    },
] as ISortConfig[];
