import { renderHook } from '@testing-library/react';

import { createMockStores } from 'frontend/__mocks__';
import { TStores } from 'frontend/store/IStores';
import SitecoreDictionary from 'models/enum/SitecoreDictionary';
import { mockSearchPodDataFields } from 'frontend/components/renderings/SearchPod/stores/mocks';

import { useBackButtonLabel, useEditButtonLabel } from './BackToSearch.utils';

jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useContext: () => mockStores,
}));

jest.mock('frontend/components/renderings/SearchPod/stores/createStore', () => ({
    ...jest.requireActual('frontend/components/renderings/SearchPod/stores/createStore'),
    useSearchPodStore: () => mockLocalStore,
}));

let mockStores: TStores;
let mockLocalStore;

const createLocalStore = () => ({
    fields: mockSearchPodDataFields,
});

describe('useBackButtonLabel', () => {
    beforeEach(() => {
        mockStores = createMockStores();
        mockLocalStore = createLocalStore();
    });

    it('should return GlobalsButtonsBack when isMobile is true and isBackToPrevUrl is false', () => {
        const { result } = renderHook(() => useBackButtonLabel(true, false));
        expect(result.current).toBe(SitecoreDictionary.GlobalsButtonsBack);
    });

    it('should return GlobalsButtonsBack when both isMobile and isBackToPrevUrl are true', () => {
        const { result } = renderHook(() => useBackButtonLabel(true, true));
        expect(result.current).toBe(SitecoreDictionary.GlobalsButtonsBack);
    });

    it('should return BackToSearchButtonText when both isMobile and isBackToPrevUrl are false', () => {
        const { result } = renderHook(() => useBackButtonLabel(false, false));
        expect(result.current).toBe(mockLocalStore.fields.BackToSearchButtonText.value);
    });
});

describe('useEditButtonLabel', () => {
    beforeEach(() => {
        mockLocalStore = createLocalStore();
    });

    it('should return EditSearchMobile when isMobile is true and isEditMode is false', () => {
        const { result } = renderHook(() => useEditButtonLabel(true, false));
        expect(result.current).toBe(mockLocalStore.fields.EditSearchMobile.value);
    });

    it('should return CloseSearchCriteriaMobile when isMobile is true and isEditMode is true', () => {
        const { result } = renderHook(() => useEditButtonLabel(true, true));
        expect(result.current).toBe(mockLocalStore.fields.CloseSearchCriteriaMobile.value);
    });

    it('should return EditSearch when isMobile is false and isEditMode is false', () => {
        const { result } = renderHook(() => useEditButtonLabel(false, false));
        expect(result.current).toBe(mockLocalStore.fields.EditSearch.value);
    });

    it('should return CloseSearchCriteria when isMobile is false and isEditMode is true', () => {
        const { result } = renderHook(() => useEditButtonLabel(false, true));
        expect(result.current).toBe(mockLocalStore.fields.CloseSearchCriteria.value);
    });
});
