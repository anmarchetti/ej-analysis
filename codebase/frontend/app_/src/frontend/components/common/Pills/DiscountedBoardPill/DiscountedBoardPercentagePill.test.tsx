import React from 'react';
import { render, screen } from '@testing-library/react';

import { createMockStores } from 'frontend/__mocks__';
import SitecoreDictionary from 'models/enum/SitecoreDictionary';

import DiscountedBoardPercentagePill, { IDiscountedBoardPercentagePillProps } from './DiscountedBoardPercentagePill';

const mockPillComponent = jest.fn();
jest.mock('frontend/components/common/Pills/Pill/Pill', () => ({
    __esModule: true,
    default: props => {
        mockPillComponent(props);

        return <div data-tid='pill' />;
    },
}));

jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useContext: () => mockStores,
}));

let mockStores;
let mockProps: IDiscountedBoardPercentagePillProps;

import styles from './DiscountedBoardPill.module.scss';

describe('<DiscountedBoardPercentagePill />', () => {
    beforeEach(() => {
        mockProps = {
            large: false,
            medium: false,
            percent: 20,
        };
        mockStores = createMockStores({
            layoutStore: {
                getSetting: jest.fn().mockReturnValue(true),
            },
        });
    });

    it('should render when isDisplayed is true and valid percent is provided', () => {
        const { container, rerender } = render(<DiscountedBoardPercentagePill {...mockProps} />);

        expect(mockPillComponent).toHaveBeenCalledWith({
            contentClass: styles.pill,
            icon: expect.any(Object),
            iconClass: styles.iconWrapper,
            text: SitecoreDictionary.PillsTooltipsDiscountedBoard,
            title: SitecoreDictionary.PillsLabelsDiscountedBoardPercentage,
        });

        expect(screen.getByTestId('pill')).toBeInTheDocument();
        expect(container.querySelector(`.${styles.wrapper}`)).not.toBeInTheDocument();

        mockProps.large = true;

        rerender(<DiscountedBoardPercentagePill {...mockProps} />);

        expect(container.querySelector(`.${styles.wrapper}.${styles.large}`)).toBeInTheDocument();
        expect(container.querySelector(`.${styles.wrapper}.${styles.medium}`)).not.toBeInTheDocument();

        mockProps.large = false;
        mockProps.medium = true;

        rerender(<DiscountedBoardPercentagePill {...mockProps} />);

        expect(container.querySelector(`.${styles.wrapper}.${styles.large}`)).not.toBeInTheDocument();
        expect(container.querySelector(`.${styles.wrapper}.${styles.medium}`)).toBeInTheDocument();
    });

    it('should NOT render when isDisplayed is false', () => {
        mockStores.layoutStore.getSetting.mockReturnValue(false);

        const { container } = render(<DiscountedBoardPercentagePill {...mockProps} />);

        expect(mockPillComponent).not.toHaveBeenCalled();

        expect(container).toBeEmptyDOMElement();
    });

    it('should NOT render when isDisplayed is true and percent is invalid', () => {
        mockProps.percent = 0;

        const { container, rerender } = render(<DiscountedBoardPercentagePill {...mockProps} />);

        expect(mockPillComponent).not.toHaveBeenCalled();

        expect(container).toBeEmptyDOMElement();

        mockProps.percent = 100;

        rerender(<DiscountedBoardPercentagePill {...mockProps} />);

        expect(container).toBeEmptyDOMElement();

        mockProps.percent = undefined;

        rerender(<DiscountedBoardPercentagePill {...mockProps} />);

        expect(container).toBeEmptyDOMElement();
    });
});
