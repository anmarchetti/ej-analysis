import { createLocalStore } from 'frontend/utils/createLocalStore';
import { ISearchPodProps } from 'frontend/components/renderings/SearchPod/SearchPod';

import { SearchPodStore } from './SearchPodStore';

export const [withSearchPodStore, useSearchPodStore] = createLocalStore<SearchPodStore, ISearchPodProps>(
    (_, { fields }) => new SearchPodStore(fields?.data),
    { isLocalForPage: true },
);
