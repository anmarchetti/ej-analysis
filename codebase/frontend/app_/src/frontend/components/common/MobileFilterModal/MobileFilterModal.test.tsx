import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { createMockStores } from 'frontend/__mocks__';

import MobileFilterModal from './MobileFilterModal';

const mockButtonComponent = jest.fn();
jest.mock('frontend/components/common/Button', () => ({
    __esModule: true,
    default: ({ children, ...props }) => {
        mockButtonComponent(props);

        return (
            <button onClick={props.onClick} data-tid={props.dataTid}>
                {children}
            </button>
        );
    },
}));

jest.mock('frontend/components/common/LeftHandFilter', () => ({
    __esModule: true,
    default: () => <div data-tid='left-hand-filter' />,
}));

jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useContext: () => mockStores,
}));

let mockStores;
let props;

describe('MobileFiltersModal', () => {
    beforeEach(() => {
        mockStores = createMockStores();
        props = { onClose: jest.fn() };
    });

    it('should be rendered', async () => {
        render(<MobileFilterModal {...props} />);

        const close = screen.getByTestId('close-filters-container-mobile-btn');
        const apply = screen.getByTestId('apply-filters-container-mobile-btn');

        expect(mockButtonComponent).toHaveBeenNthCalledWith(1, {
            dataTid: 'close-filters-container-mobile-btn',
            isFullWidth: true,
            isTransparent: true,
            onClick: expect.any(Function),
        });
        expect(mockButtonComponent).toHaveBeenNthCalledWith(2, {
            dataTid: 'apply-filters-container-mobile-btn',
            isFullWidth: true,
            onClick: expect.any(Function),
        });

        expect(screen.getByTestId('left-hand-filter')).toBeInTheDocument();

        expect(close).toBeInTheDocument();
        expect(apply).toBeInTheDocument();

        await userEvent.click(close);

        expect(props.onClose).toHaveBeenCalledTimes(1);

        await userEvent.click(apply);

        expect(props.onClose).toHaveBeenCalledTimes(2);
    });
});
