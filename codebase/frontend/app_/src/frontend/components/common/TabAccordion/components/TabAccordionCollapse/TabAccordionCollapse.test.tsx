import React, { Component } from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { mockSitecoreField } from 'frontend/utils/tests.utils';

import TabAccordionCollapse, { ITabAccordionCollapseProps } from './TabAccordionCollapse';

const createProps = (): ITabAccordionCollapseProps => ({
    isOpened: false,
    renderContent: jest.fn(),
    tab: {
        id: 'id',
        ContentTab: mockSitecoreField('Content'),
        TitleTab: mockSitecoreField('Title'),
    },
    onTabClick: jest.fn(),
    scrollIntoView: false,
    tabCollapseBtnClassName: 'tabCollapseBtnClassName',
    tabCollapseBtnSelectedClassName: 'tabCollapseBtnSelectedClassName',
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

const mockTextProps = jest.fn();
jest.mock('@sitecore-jss/sitecore-jss-nextjs', () => ({
    __esModule: true,
    Text: props => {
        mockTextProps(props);

        return <div data-tid='sitecore-jss-text' />;
    },
}));

jest.mock('frontend/components/icons/ChevronDown', () => ({
    __esModule: true,
    default: () => <div data-tid='chevron-down' />,
}));

describe('TabAccordionCollapse', () => {
    beforeEach(() => {
        mockProps = createProps();
    });

    it('should render standard', () => {
        render(<TabAccordionCollapse {...mockProps} />);

        expect(screen.getByTestId('tab-collapse')).toBeInTheDocument();

        expect(screen.getByTestId('button')).toBeInTheDocument();
        expect(mockButtonProps).toHaveBeenCalledWith({
            className: 'button tabCollapseBtnClassName',
            onClick: expect.any(Function),
            'aria-expanded': mockProps.isOpened,
            isFullWidth: true,
            isText: true,
            children: expect.any(Array<Component>),
            'data-tid': 'tab-collapse-button',
        });

        expect(screen.getByTestId('sitecore-jss-text')).toBeInTheDocument();
        expect(mockTextProps).toHaveBeenCalledWith({
            tag: 'span',
            field: mockProps.tab.TitleTab,
        });

        expect(screen.getByTestId('chevron-down')).toBeInTheDocument();
    });

    it('should render content when isOpened prop is true', () => {
        mockProps.isOpened = true;
        render(<TabAccordionCollapse {...mockProps} />);

        expect(screen.getByTestId('tab-collapse')).toBeInTheDocument();

        expect(screen.getByTestId('button')).toBeInTheDocument();
        expect(mockButtonProps).toHaveBeenCalledWith({
            className: 'button tabCollapseBtnClassName tabCollapseBtnSelectedClassName buttonSelected',
            onClick: expect.any(Function),
            'aria-expanded': mockProps.isOpened,
            isFullWidth: true,
            isText: true,
            children: expect.any(Array<Component>),
            'data-tid': 'tab-collapse-button',
        });

        expect(mockProps.renderContent).toHaveBeenCalledWith(mockProps.tab);
    });

    it('should call onTabClick prop when user clicks the button', async () => {
        render(<TabAccordionCollapse {...mockProps} />);

        await userEvent.click(screen.getByTestId('button'));

        expect(mockProps.onTabClick).toHaveBeenCalled();
    });

    it('should call scroll into view when isOpened prop was changed to true', async () => {
        const scrollIntoViewMock = jest.fn();
        HTMLElement.prototype.scrollIntoView = scrollIntoViewMock;

        mockProps.scrollIntoView = true;
        const { rerender } = render(<TabAccordionCollapse {...mockProps} />);

        expect(scrollIntoViewMock).not.toHaveBeenCalled();

        mockProps.isOpened = true;

        rerender(<TabAccordionCollapse {...mockProps} />);

        expect(scrollIntoViewMock).toHaveBeenCalled();
    });
});
