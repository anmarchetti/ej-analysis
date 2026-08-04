import React from 'react';
import { render, screen } from '@testing-library/react';

import { createMockStores } from 'frontend/__mocks__/createMockStores';
import SitecoreDictionary from 'models/enum/SitecoreDictionary';

import { INewItemPillProps, NewItemPill } from './NewItemPill';

const createProps = () =>
    ({
        isShown: true,
    } as INewItemPillProps);

let mockProps;
let mockStores;

jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useContext: () => mockStores,
}));

describe('<NewItemPill />', () => {
    beforeEach(() => {
        mockStores = createMockStores();
        mockProps = createProps();
    });

    it('should NOT render when isShown is not provided', () => {
        const { container } = render(<NewItemPill />);

        expect(container).toBeEmptyDOMElement();
    });

    it('should NOT render when newLabel is NOT provided', () => {
        mockStores.layoutStore.getPhrase = jest.fn();

        const { container } = render(<NewItemPill {...mockProps} />);

        expect(container).toBeEmptyDOMElement();
    });

    it('should render pill with new label', () => {
        render(<NewItemPill {...mockProps} />);

        expect(screen.getByTestId('new-item-pill')).toHaveTextContent(SitecoreDictionary.GlobalsLabelsNewLabel);
    });

    it('should render pill with class from props', () => {
        mockProps.className = 'test-class';

        render(<NewItemPill {...mockProps} />);

        expect(screen.getByTestId('new-item-pill')).toHaveClass('pill test-class');
    });
});
