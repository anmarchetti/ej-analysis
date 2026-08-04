import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { createMockStores, mockUnavailablePopupFields } from 'frontend/__mocks__';
import { IUnavailablePopupFields } from 'models/data/IUnavailablePopup';
import { ISitecoreComponent } from 'models/sitecore/generic/ISitecoreComponent';

import AmendRoomAndBoardUnavailablePopup from './AmendRoomAndBoardUnavailablePopup';

let mockProps: ISitecoreComponent<IUnavailablePopupFields>;
let mockStores;

jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useContext: () => mockStores,
}));

const mockUnavailablePopupProps = jest.fn();
jest.mock('frontend/components/common/UnavailableFlowPopup/UnavailableFlowPopup', () => ({
    __esModule: true,
    default: ({ onClose, ...props }) => {
        mockUnavailablePopupProps(props);

        return <div data-tid='unavailable-popup' onClick={onClose} />;
    },
}));

describe('<AmendRoomAndBoardUnavailablePopup />', () => {
    beforeEach(() => {
        mockProps = {
            fields: mockUnavailablePopupFields,
            params: {},
            rendering: 'rendering',
        };
        mockStores = createMockStores({
            amendRoomAndBoardStore: {
                setAreVariantsUnavailable: jest.fn(),
                areRoomAndBoardVariantsUnavailable: true,
            },
        });
    });

    it('should NOT be rendered if no fields', () => {
        mockProps.fields = undefined;
        render(<AmendRoomAndBoardUnavailablePopup {...mockProps} />);

        expect(screen.queryByTestId('unavailable-popup')).not.toBeInTheDocument();
    });

    it('should NOT be rendered if areRoomAndBoardVariantsUnavailable is false', () => {
        mockStores.amendRoomAndBoardStore.areRoomAndBoardVariantsUnavailable = false;
        render(<AmendRoomAndBoardUnavailablePopup {...mockProps} />);

        expect(screen.queryByTestId('unavailable-popup')).not.toBeInTheDocument();
    });

    it('should render component with areRoomAndBoardVariantsUnavailable is true', () => {
        render(<AmendRoomAndBoardUnavailablePopup {...mockProps} />);

        expect(screen.getByTestId('unavailable-popup')).toBeInTheDocument();
        expect(mockUnavailablePopupProps).toHaveBeenCalledWith({
            fields: mockProps.fields,
        });
    });

    it('should call onClose functions', async () => {
        render(<AmendRoomAndBoardUnavailablePopup {...mockProps} />);

        const popup = screen.getByTestId('unavailable-popup');
        await userEvent.click(popup);

        expect(mockStores.amendRoomAndBoardStore.setAreVariantsUnavailable).toHaveBeenCalledWith(false);
    });
});
