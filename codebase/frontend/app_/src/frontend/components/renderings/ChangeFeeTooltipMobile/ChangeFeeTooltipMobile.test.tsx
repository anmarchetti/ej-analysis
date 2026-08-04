import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { createMockStores } from 'frontend/__mocks__';
import { mockChangeFeeFields } from 'frontend/__mocks__/changeFee';
import { mockTokenizer } from 'frontend/__mocks__/utils/tokenizer';
import SitecoreDictionary from 'models/enum/SitecoreDictionary';

import { ChangeFeeTooltipMobile, TChangeFeeTooltipMobileProps } from './ChangeFeeTooltipMobile';

const createMockProps = (): TChangeFeeTooltipMobileProps => ({
    fields: mockChangeFeeFields,
    rendering: {},
    params: {},
});

let mockProps = createMockProps();
let mockStores = createMockStores();

jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useContext: () => mockStores,
}));

jest.mock('frontend/utils/tokenizer', () => ({
    __esModule: true,
    Tokenizer: mockTokenizer,
}));

const mockHeightAnimatedContainer = jest.fn();
jest.mock('frontend/components/common/HeightAnimatedContainer/HeightAnimatedContainer', () => ({
    __esModule: true,
    default: props => {
        mockHeightAnimatedContainer(props);

        return <div data-tid='height-animated-container'>{props.children}</div>;
    },
}));

jest.mock('frontend/components/common/Button', () => ({
    __esModule: true,
    default: props => (
        <button data-tid={props.dataTid} onClick={props.onClick}>
            {props.children}
        </button>
    ),
}));

describe('ChangeFeeTooltipMobile', () => {
    beforeEach(() => {
        mockProps = createMockProps();
        mockStores = createMockStores();
    });

    it('should return null when no fields', () => {
        mockProps.fields = undefined;

        const { container } = render(<ChangeFeeTooltipMobile {...mockProps} />);

        expect(container).toBeEmptyDOMElement();
    });

    it('should return null when no amendHotelFeePP', () => {
        mockStores.amendHotelStore.feePP = 0;

        const { container } = render(<ChangeFeeTooltipMobile {...mockProps} />);

        expect(container).toBeEmptyDOMElement();
    });

    it('should render compoent', () => {
        render(<ChangeFeeTooltipMobile {...mockProps} />);

        expect(screen.getByTestId('charge-fee-popup-open')).toHaveAccessibleName(
            mockProps.fields?.TooltipIconAriaLabelMobile.value,
        );
        expect(mockHeightAnimatedContainer).toHaveBeenCalledWith({
            isOpened: false,
            children: expect.anything(),
        });
        expect(screen.getByTestId('height-animated-container')).toBeInTheDocument();
        expect(screen.getByTestId('tooltip-popup')).toHaveTextContent(mockProps.fields!.Title.value);
        expect(screen.getByTestId('tooltip-popup-description')).toHaveTextContent(
            'Description Globals.PriceLabels.PerPerson £30',
        );
        expect(screen.getByTestId('charge-fee-popup-close-btn')).toHaveTextContent(
            SitecoreDictionary.GlobalsButtonsClose,
        );
        expect(screen.queryByTestId('grey-overlay')).not.toBeInTheDocument();
    });

    it('should render overlay and change view when click on charge-fee-popup-open button', async () => {
        render(<ChangeFeeTooltipMobile {...mockProps} />);

        await userEvent.click(screen.getByTestId('charge-fee-popup-open'));

        expect(mockHeightAnimatedContainer).toHaveBeenCalledWith({
            isOpened: true,
            children: expect.anything(),
        });
        expect(screen.getByTestId('grey-overlay')).toBeInTheDocument();

        await userEvent.click(screen.getByTestId('charge-fee-popup-close-btn'));

        expect(mockHeightAnimatedContainer).toHaveBeenCalledWith({
            isOpened: false,
            children: expect.anything(),
        });
        expect(screen.queryByTestId('grey-overlay')).not.toBeInTheDocument();
    });
});
