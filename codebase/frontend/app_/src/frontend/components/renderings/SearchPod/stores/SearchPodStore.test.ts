import { mockSitecoreField, mockSitecoreImageField } from 'frontend/utils/tests.utils';
import { ISearchPodDataFields } from 'frontend/components/renderings/SearchPod/models';

import { mockSearchPodDataFields } from './mocks';
import { SearchPodStore } from './SearchPodStore';

const resetMocks = () => ({
    fields: mockSearchPodDataFields,
});

let store: SearchPodStore;
let mocks;

describe('SearchPodStore', () => {
    beforeEach(() => {
        mocks = resetMocks();
        store = new SearchPodStore(mocks.fields);
    });

    it('should initialize with fields', () => {
        expect(store.fields).toEqual(mocks.fields);
    });

    it('should update fields', () => {
        const newFields = {
            SearchToHotelMessageTitle: mockSitecoreField('New Title'),
            SearchToHotelMessageText: mockSitecoreField('New Text'),
            SearchToHotelMessageIcon: mockSitecoreField(mockSitecoreImageField('new-icon.png')),
        } as ISearchPodDataFields;

        store.setFields(newFields);
        expect(store.fields).toEqual(newFields);
    });
});
