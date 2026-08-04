import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { createMockStores } from 'frontend/__mocks__';

import { IManageHubCTAProps, ManageHubCTA } from './ManageHubCTA';

let mockProps: IManageHubCTAProps;
let mockStores;

jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useContext: () => mockStores,
}));

const mockBtnProps = jest.fn();
jest.mock('frontend/components/common/Button', () => ({
    __esModule: true,
    default: ({ onClick, ...props }) => {
        mockBtnProps(props);

        return <div data-tid='button' onClick={onClick} />;
    },
}));

describe('<ManageHubCTA />', () => {
    beforeEach(() => {
        mockProps = {
            label: 'label',
        };
        mockStores = createMockStores({
            routerStore: {
                redirectToManageHubPage: jest.fn(),
            },
        });
    });

    it('should render component', () => {
        render(<ManageHubCTA {...mockProps} />);

        expect(screen.getByTestId('button')).toBeInTheDocument();
        expect(mockBtnProps).toHaveBeenCalledWith({
            dataTid: 'manage-holiday-btn',
            isMedium: true,
            isLoading: false,
            className: 'btn',
            children: 'label',
        });
    });

    it('should call handlers by click on button', async () => {
        render(<ManageHubCTA {...mockProps} />);

        await userEvent.click(screen.getByTestId('button'));

        expect(mockStores.trackingStore.trackManageHubClick).toHaveBeenCalled();
        expect(mockStores.routerStore.redirectToManageHubPage).toHaveBeenCalled();
    });

    it('should render with buttonClass prop', () => {
        mockProps = {
            label: 'label',
            buttonClass: 'custom-button-class',
        };

        render(<ManageHubCTA {...mockProps} />);

        expect(screen.getByTestId('button')).toBeInTheDocument();
        expect(mockBtnProps).toHaveBeenCalledWith({
            dataTid: 'manage-holiday-btn',
            isMedium: true,
            isLoading: false,
            className: 'btn custom-button-class',
            children: 'label',
        });
    });

    it('should call trackManageHubClick and redirectToManageHubPage when clicked', async () => {
        mockStores.trackingStore.trackManageHubClick.mockResolvedValue(undefined);

        render(<ManageHubCTA {...mockProps} />);

        const button = screen.getByTestId('button');
        await userEvent.click(button);

        expect(mockStores.trackingStore.trackManageHubClick).toHaveBeenCalled();
        expect(mockStores.routerStore.redirectToManageHubPage).toHaveBeenCalled();
    });
});
