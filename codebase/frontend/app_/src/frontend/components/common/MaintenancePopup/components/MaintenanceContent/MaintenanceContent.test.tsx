import React from 'react';
import { render, screen } from '@testing-library/react';

import SitecoreDictionary from 'models/enum/SitecoreDictionary';

import MaintenanceContent from './MaintenanceContent';

const mockIcon = jest.fn();
jest.mock('frontend/components/icons-new/Cogs', () => ({
    __esModule: true,
    default: () => {
        mockIcon();

        return <div data-tid='cogs-icon' />;
    },
}));

const createStores = () => ({
    layoutStore: { getPhrase: jest.fn(p => p) },
});

let mockStores = createStores();

jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useContext: () => mockStores,
}));

describe('MaintenanceContent', () => {
    beforeEach(() => {
        mockStores = createStores();
    });

    it('should render title', () => {
        render(<MaintenanceContent />);

        expect(screen.getByText(SitecoreDictionary.MaintenancePopupLabelsTitle)).toBeInTheDocument();
    });

    it('should render icon', () => {
        render(<MaintenanceContent />);

        expect(mockIcon).toBeCalled();
    });

    it('should render description', () => {
        render(<MaintenanceContent />);

        expect(screen.getByText('MaintenancePopup.Labels.FirstParagraph', { exact: false })).toBeInTheDocument();
        expect(screen.getByText('MaintenancePopup.Labels.SecondParagraph', { exact: false })).toBeInTheDocument();
    });
});
