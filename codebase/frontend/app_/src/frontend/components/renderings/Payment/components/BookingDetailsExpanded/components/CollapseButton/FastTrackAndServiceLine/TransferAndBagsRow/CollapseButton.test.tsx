import React from 'react';
import { render, screen } from '@testing-library/react';

import { createMockStores } from 'frontend/__mocks__';
import SitecoreDictionary from 'models/enum/SitecoreDictionary';

import CollapseButton, { TCollapseButtonProps } from './CollapseButton';

const createProps = (): TCollapseButtonProps => ({
    onClick: jest.fn(),
});

let mockProps = createProps();
let mockStores = createMockStores();

jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useContext: () => mockStores,
}));

const mockButton = jest.fn();
jest.mock('frontend/components/common/Button', () => ({
    __esModule: true,
    default: props => {
        mockButton(props);

        return (
            <div data-tid='button' onClick={props.onClick}>
                {props.children}
            </div>
        );
    },
}));

const mockChevronUp = jest.fn();
jest.mock('frontend/components/icons-new/ChevronUp', () => ({
    __esModule: true,
    default: props => {
        mockChevronUp(props);

        return <div data-tid='chevron-up' />;
    },
}));

describe('CollapseButton', () => {
    beforeEach(() => {
        mockProps = createProps();
        mockStores = createMockStores();
    });

    it('should render button', () => {
        render(<CollapseButton {...mockProps} />);

        expect(mockButton).toHaveBeenCalledWith({
            onClick: mockProps.onClick,
            isText: true,
            dataTid: 'collapse-toggle',
            className: 'collapseBtn',
            children: expect.anything(),
        });
        expect(screen.getByTestId('button')).toHaveTextContent(SitecoreDictionary.PaymentButtonsHideDetails);

        expect(screen.getByTestId('chevron-up')).toBeInTheDocument();
        expect(mockChevronUp).toHaveBeenCalledWith({
            className: 'btnIcon',
        });
    });

    it('should call onClick when button is clicked', () => {
        render(<CollapseButton {...mockProps} />);

        screen.getByTestId('button').click();

        expect(mockProps.onClick).toHaveBeenCalled();
    });
});
