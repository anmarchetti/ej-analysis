import React from 'react';
import { render, screen } from '@testing-library/react';

import { createMockStores, mockUnavailablePopupFields } from 'frontend/__mocks__';
import { AttentionPopupMobilePosition } from 'frontend/components/renderings/AttentionPopup/AttentionPopup';

import UnavailableFlowPopup from './UnavailableFlowPopup';

let mockProps;
let mockStores;

jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useContext: () => mockStores,
}));

const mockAttentionPopupProps = jest.fn();
jest.mock('frontend/components/renderings/AttentionPopup/AttentionPopup', () => ({
    __esModule: true,
    ...jest.requireActual('frontend/components/renderings/AttentionPopup/AttentionPopup'),
    default: props => {
        mockAttentionPopupProps(props);

        return <div data-tid='unavailable-popup' />;
    },
}));

describe('<UnavailableFlowPopup />', () => {
    beforeEach(() => {
        mockProps = {
            fields: mockUnavailablePopupFields,
            isLoading: true,
        };
        mockStores = createMockStores();
    });

    it('should render component', () => {
        render(<UnavailableFlowPopup {...mockProps} />);

        expect(screen.getByTestId('unavailable-popup')).toBeInTheDocument();
        expect(mockAttentionPopupProps).toHaveBeenCalledWith({
            mobilePosition: AttentionPopupMobilePosition.Center,
            fields: {
                ...mockProps.fields,
                SecondaryCTA: mockProps.fields.NoOptionsCTA,
            },
            isLoading: true,
            disableOutsideClick: true,
        });
    });
});
