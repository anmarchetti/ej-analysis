import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { mockSitecoreField } from 'frontend/utils/tests.utils';

import TabAccordionToggle, { ITabAccordionToggleProps } from './TabAccordionToggle';

const createProps = (): ITabAccordionToggleProps => ({
    tab: {
        id: 'id',
        ContentTab: mockSitecoreField('Content'),
        TitleTab: mockSitecoreField('Title'),
    },
    isOpened: false,
    onTabClick: jest.fn(),
    tabToggleClassName: 'tabToggleClassName',
    tabToggleSelectedClassName: 'tabToggleSelectedClassName',
});

let mockProps = createProps();

const mockButtonProps = jest.fn();
jest.mock('frontend/components/common/Button', () => ({
    __esModule: true,
    default: props => {
        mockButtonProps(props);

        return (
            <button data-tid='button' onClick={props.onClick}>
                {props.children}
            </button>
        );
    },
}));

jest.mock('frontend/components/icons/ChevronRight', () => ({
    __esModule: true,
    default: () => <div data-tid='chevron-right' />,
}));

describe('TabAccordionToggle', () => {
    beforeEach(() => {
        mockProps = createProps();
    });

    it('should render standard', () => {
        render(<TabAccordionToggle {...mockProps} />);

        expect(screen.getByTestId('button')).toBeInTheDocument();
        expect(mockButtonProps).toHaveBeenCalledWith({
            className: 'button tabToggleClassName',
            onClick: expect.any(Function),
            'aria-expanded': mockProps.isOpened,
            isFullWidth: true,
            isText: true,
            'data-tid': 'tab-toggle',
            children: expect.anything(),
        });

        expect(screen.getByTestId('chevron-right')).toBeInTheDocument();
    });

    it('should render content when isOpened prop is true', () => {
        mockProps.isOpened = true;
        render(<TabAccordionToggle {...mockProps} />);

        expect(screen.getByTestId('button')).toBeInTheDocument();
        expect(mockButtonProps).toHaveBeenCalledWith({
            className: 'button tabToggleClassName buttonSelected tabToggleSelectedClassName',
            onClick: expect.any(Function),
            'aria-expanded': mockProps.isOpened,
            isFullWidth: true,
            isText: true,
            'data-tid': 'tab-toggle',
            children: expect.anything(),
        });

        expect(screen.getByTestId('chevron-right')).toBeInTheDocument();
    });

    it('should call onTabClick prop when user clicks the button', async () => {
        render(<TabAccordionToggle {...mockProps} />);

        await userEvent.click(screen.getByTestId('button'));

        expect(mockProps.onTabClick).toHaveBeenCalled();
    });

    it('should render children if it is provided', async () => {
        mockProps.children = <div data-tid='child' />;
        render(<TabAccordionToggle {...mockProps} />);

        expect(screen.getByTestId('child')).toBeInTheDocument();
    });
});
