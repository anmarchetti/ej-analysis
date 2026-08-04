import React from 'react';
import { render, screen } from '@testing-library/react';

import OptionItemHoldLuggagePopup, { IOptionItemHoldLuggagePopupProps } from './OptionItemHoldLuggagePopup';

const createProps = (): IOptionItemHoldLuggagePopupProps => ({
    icon: 'icon',
    name: 'name',
    shouldRender: true,
    children: <div data-tid='children' />,
});

let mockProps;

describe('OptionItemHoldLuggagePopup', () => {
    beforeEach(() => {
        mockProps = createProps();
    });

    it('should NOT render icon when it is undefined', () => {
        mockProps.icon = undefined;

        render(<OptionItemHoldLuggagePopup {...mockProps} />);

        expect(screen.queryByTestId('icon')).not.toBeInTheDocument();
    });

    it('should render OptionItemHoldLuggagePopup when shouldRender == true', () => {
        render(<OptionItemHoldLuggagePopup {...mockProps} />);

        expect(screen.getByTestId('hold-luggage-item')).toBeInTheDocument();
        expect(screen.getByTestId('hold-luggage-option-name')).toHaveClass('name');
        expect(screen.getByTestId('children')).toBeInTheDocument();
        expect(screen.getByTestId('icon')).toBeInTheDocument();
    });

    it('should NOT render OptionItemHoldLuggagePopup when shouldRender == false', () => {
        mockProps.shouldRender = false;

        const { container } = render(<OptionItemHoldLuggagePopup {...mockProps} />);

        expect(container).toBeEmptyDOMElement();
    });
});
