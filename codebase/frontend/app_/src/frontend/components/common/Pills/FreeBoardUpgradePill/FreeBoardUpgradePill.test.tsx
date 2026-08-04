import React from 'react';
import { render, screen } from '@testing-library/react';

import { createMockStores } from 'frontend/__mocks__/createMockStores';
import SitecoreDictionary from 'models/enum/SitecoreDictionary';
import { PillSizeVariants } from 'frontend/components/common/Pills/PillWithVariants/PillSizeVariants';

import { FreeBoardUpgradePill } from './FreeBoardUpgradePill';

jest.mock('frontend/components/icons/InfoCircle', () => ({
    __esModule: true,
    default: () => <div data-tid='info-circle-icon' />,
}));

jest.mock('frontend/components/icons-new/Cup', () => ({
    __esModule: true,
    default: () => <div data-tid='cup-icon' />,
}));

const mockPillWithVariants = jest.fn();
jest.mock('frontend/components/common/Pills/PillWithVariants/PillWithVariants', () => ({
    __esModule: true,
    default: ({ content, ...props }) => {
        mockPillWithVariants(props);

        return (
            <div data-tid='pill-with-variants'>
                {content.icon}
                <p>{content.text}</p>
                <p>{content.tooltipMessage}</p>
            </div>
        );
    },
}));

const createProps = () => ({
    isFreeBoardUpgrade: true,
    pillSize: PillSizeVariants.Big,
    tooltipClass: 'tooltip',
});

let mockProps;
let mockStores;

jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useContext: () => mockStores,
}));

describe('<FreeBoardUpgradePill />', () => {
    beforeEach(() => {
        mockProps = createProps();
        mockStores = createMockStores();
    });

    it('should NOT render when IsFreeBoardUpgradePillEnabled is false', () => {
        mockStores.layoutStore.getSetting = jest.fn(() => false);

        const { container } = render(<FreeBoardUpgradePill {...mockProps} />);

        expect(container).toBeEmptyDOMElement();
    });

    it('should NOT render when isFreeBoardUpgrade is false', () => {
        mockProps.isFreeBoardUpgrade = false;

        const { container } = render(<FreeBoardUpgradePill {...mockProps} />);

        expect(container).toBeEmptyDOMElement();
    });

    it('should render PillWithVariants when pillSize is undefined', () => {
        mockProps.pillSize = undefined;

        render(<FreeBoardUpgradePill {...mockProps} />);

        expect(screen.getByTestId('pill-with-variants')).toBeInTheDocument();
        expect(screen.getByTestId('cup-icon')).toBeInTheDocument();
        expect(screen.getByText(SitecoreDictionary.FreeUpgradesLabelsFreeBoardUpgradePillSmall)).toBeInTheDocument();
        expect(screen.getByText(SitecoreDictionary.FreeUpgradesLabelsFreeBoardUpgradeTooltip)).toBeInTheDocument();
        expect(mockPillWithVariants).toHaveBeenCalledWith({
            dataIdPrefix: 'free-board-upgrade',
            pillSize: undefined,
            pillClass: 'pill',
            tooltipClass: 'tooltip',
        });
    });

    it('should render big PillWithVariants when pillSize is big', () => {
        render(<FreeBoardUpgradePill {...mockProps} />);

        expect(screen.getByTestId('pill-with-variants')).toBeInTheDocument();
        expect(screen.getByTestId('info-circle-icon')).toBeInTheDocument();
        expect(screen.getByText(SitecoreDictionary.FreeUpgradesLabelsFreeBoardUpgradePillBig)).toBeInTheDocument();
        expect(screen.getByText(SitecoreDictionary.FreeUpgradesLabelsFreeBoardUpgradeTooltip)).toBeInTheDocument();
        expect(mockPillWithVariants).toHaveBeenCalledWith({
            dataIdPrefix: 'free-board-upgrade',
            pillSize: PillSizeVariants.Big,
            pillClass: 'pill',
            tooltipClass: 'tooltip',
        });
    });

    it('should render pill variant PillWithVariants when pillSize is regular', () => {
        mockProps.pillSize = PillSizeVariants.Regular;

        render(<FreeBoardUpgradePill {...mockProps} />);

        expect(screen.getByTestId('pill-with-variants')).toBeInTheDocument();
        expect(screen.getByTestId('info-circle-icon')).toBeInTheDocument();
        expect(screen.getByText(SitecoreDictionary.FreeUpgradesLabelsFreeBoardUpgradePillSmall)).toBeInTheDocument();
        expect(screen.getByText(SitecoreDictionary.FreeUpgradesLabelsFreeBoardUpgradeTooltip)).toBeInTheDocument();
        expect(mockPillWithVariants).toHaveBeenCalledWith({
            dataIdPrefix: 'free-board-upgrade',
            pillSize: PillSizeVariants.Regular,
            pillClass: 'pill',
            tooltipClass: 'tooltip',
        });
    });
});
