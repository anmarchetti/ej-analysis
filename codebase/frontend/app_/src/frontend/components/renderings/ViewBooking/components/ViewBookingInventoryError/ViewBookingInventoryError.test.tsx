import React from 'react';
import { render } from '@testing-library/react';

import { createMockStores as createInitialMockStores } from 'frontend/__mocks__';
import { PlaceholderNames } from 'models/enum/PlaceholderNames';

import ViewBookingInventoryError from './ViewBookingInventoryError';

const createProps = () => ({
    onClose: jest.fn(),
    rendering: {},
});

const createMockStores = () => createInitialMockStores();

let mockProps;
let mockStores;

jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useContext: () => mockStores,
}));

const mockPlaceholderComponent = jest.fn();

jest.mock('@sitecore-jss/sitecore-jss-nextjs', () => ({
    __esModule: true,
    Placeholder: ({ children, ...props }) => {
        mockPlaceholderComponent(props);

        return (
            <div data-tid='placeholder'>
                {children}
                <button>onClose</button>
            </div>
        );
    },
}));

describe('<ViewBookingInventoryError />', () => {
    beforeEach(() => {
        mockStores = createMockStores();
        mockProps = createProps();
    });

    it('Render placeholder', () => {
        render(<ViewBookingInventoryError {...mockProps} />);

        expect(mockPlaceholderComponent).toHaveBeenCalledWith({
            name: PlaceholderNames.AttentionPopup,
            popupType: 'InventoryError',
            rendering: mockProps.rendering,
            descriptionHandler: expect.any(Function),
            onClose: mockProps.onClose,
        });
    });
});
