import React from 'react';
import { render } from '@testing-library/react';

import { createMockStores } from 'frontend/__mocks__';
import SearchFilterStore from 'frontend/store/holidays/search/SearchFiltersStore';
import { FilterGroupCodes } from 'models/enum/FilterGroupCodes';

import GroupContent from './GroupContent';
import * as utils from './GroupContent.utils';

const mockStore = new SearchFilterStore(createMockStores());

describe('<GroupContent />', () => {
    it('should render itself', () => {
        const addScrollbarToParentIfNeeded = jest.spyOn(utils, 'addScrollbarToParentIfNeeded');
        const renderContent = jest.spyOn(utils, 'renderContent').mockReturnValue(null);

        render(<GroupContent storeInstance={mockStore} code={FilterGroupCodes.Offers} />);

        expect(addScrollbarToParentIfNeeded).toHaveBeenCalledTimes(1);
        expect(renderContent).toHaveBeenCalledWith(FilterGroupCodes.Offers, mockStore);
    });
});
