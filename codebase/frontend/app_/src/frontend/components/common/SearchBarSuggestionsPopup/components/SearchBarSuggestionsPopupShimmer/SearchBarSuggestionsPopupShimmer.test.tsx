import * as React from 'react';
import { render } from '@testing-library/react';

import { createMockStores } from 'frontend/__mocks__/createMockStores';
import { createMockLocalStore } from 'frontend/components/renderings/SearchPod/stores/mocks';

import SearchBarSuggestionsPopupShimmer, {
    DEFAULT_ITEM_COUNT,
    ISearchBarSuggestionsPopupShimmerProps,
} from './SearchBarSuggestionsPopupShimmer';

jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useContext: () => mockStores,
}));

jest.mock('frontend/components/renderings/SearchPod/stores/createStore', () => ({
    ...jest.requireActual('frontend/components/renderings/SearchPod/stores/createStore'),
    useSearchPodStore: () => mockLocalStore,
}));

const createProps = (): ISearchBarSuggestionsPopupShimmerProps => ({
    className: 'className',
    isMultiline: false,
});

let mockProps;
let mockStores;
let mockLocalStore;

describe('<SearchBarSuggestionsPopupShimmer />', () => {
    beforeEach(() => {
        mockProps = createProps();
        mockStores = createMockStores();
        mockLocalStore = createMockLocalStore();
    });

    it('should render shimmer for Row variant when isMultiline is false', () => {
        const { container } = render(<SearchBarSuggestionsPopupShimmer {...mockProps} />);

        expect(container.firstChild).toHaveClass(mockProps.className);
        expect(container.getElementsByClassName('sb-popup-inner')).toHaveLength(1);
        expect(container.querySelector('.sb-popup--loading__msg')).toHaveTextContent(
            mockLocalStore.fields.LoadingLabel.value,
        );
        expect(container.getElementsByClassName('popup-items')).toHaveLength(1);
        expect(container.getElementsByClassName('popup-item popup-item-shimmer')).toHaveLength(DEFAULT_ITEM_COUNT);
        expect(container.getElementsByClassName('popup-item-left')).toHaveLength(DEFAULT_ITEM_COUNT);
        expect(container.getElementsByClassName('icon placeholder-shimmer')).toHaveLength(DEFAULT_ITEM_COUNT);
        expect(container.getElementsByClassName('popup-item-name placeholder-shimmer')).toHaveLength(
            DEFAULT_ITEM_COUNT,
        );
        expect(container.getElementsByClassName('popup-item-right placeholder-shimmer')).toHaveLength(
            DEFAULT_ITEM_COUNT,
        );
    });

    it('should render shimmer for Multiline variant when isMultiline is true', () => {
        mockProps.isMultiline = true;
        const { container } = render(<SearchBarSuggestionsPopupShimmer {...mockProps} />);

        expect(container.firstChild).toHaveClass(mockProps.className);
        expect(container.getElementsByClassName('sb-popup-inner')).toHaveLength(1);
        expect(container.querySelector('.sb-popup--loading__msg')).toHaveTextContent(
            mockLocalStore.fields.LoadingLabel.value,
        );
        expect(container.getElementsByClassName('popup-items')).toHaveLength(1);
        expect(container.getElementsByClassName('popup-item popup-item-shimmer')).toHaveLength(DEFAULT_ITEM_COUNT);
        expect(container.getElementsByClassName('popup-item-top')).toHaveLength(DEFAULT_ITEM_COUNT);
        expect(container.getElementsByClassName('icon placeholder-shimmer')).toHaveLength(DEFAULT_ITEM_COUNT);
        expect(container.getElementsByClassName('popup-item-name placeholder-shimmer')).toHaveLength(
            DEFAULT_ITEM_COUNT,
        );
        expect(container.getElementsByClassName('popup-item-bottom placeholder-shimmer')).toHaveLength(
            DEFAULT_ITEM_COUNT,
        );
    });
});
