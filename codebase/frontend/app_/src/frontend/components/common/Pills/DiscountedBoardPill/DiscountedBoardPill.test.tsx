import React from 'react';
import { render, screen } from '@testing-library/react';

import { createMockStores } from 'frontend/__mocks__';
import SitecoreDictionary from 'models/enum/SitecoreDictionary';

import DiscountedBoardPill, { IDiscountedBoardPillProps } from './DiscountedBoardPill';

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
let mockProps: IDiscountedBoardPillProps;

import styles from './DiscountedBoardPill.module.scss';

describe('<DiscountedBoardPill />', () => {
    beforeEach(() => {
        mockProps = {
            large: false,
        };
        mockStores = createMockStores({
            layoutStore: {
                getSetting: jest.fn().mockReturnValue(true),
            },
        });
    });

    it('should render when isDisplayed is true', () => {
        const { container, rerender } = render(<DiscountedBoardPill {...mockProps} />);

        expect(mockPillComponent).toHaveBeenCalledWith({
            contentClass: styles.pill,
            ellipsis: true,
            icon: expect.any(Object),
            iconClass: styles.iconWrapper,
            text: SitecoreDictionary.PillsTooltipsDiscountedBoard,
            title: SitecoreDictionary.PillsLabelsDiscountedBoard,
        });

        expect(screen.getByTestId('pill')).toBeInTheDocument();
        expect(container.querySelector(`.${styles.wrapper}`)).not.toBeInTheDocument();

        mockProps.large = true;

        rerender(<DiscountedBoardPill {...mockProps} />);

        expect(container.querySelector(`.${styles.wrapper}.${styles.large}`)).toBeInTheDocument();
        expect(container.querySelector(`.${styles.wrapper}.${styles.medium}`)).not.toBeInTheDocument();
    });

    it('should NOT render when isDisplayed is false', () => {
        mockStores.layoutStore.getSetting.mockReturnValue(false);

        const { container } = render(<DiscountedBoardPill {...mockProps} />);

        expect(mockPillComponent).not.toHaveBeenCalled();

        expect(container).toBeEmptyDOMElement();
    });
});
