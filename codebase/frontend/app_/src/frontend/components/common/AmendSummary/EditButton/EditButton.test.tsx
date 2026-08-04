import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';

import { createMockStores } from 'frontend/__mocks__';
import SitecoreDictionary from 'models/enum/SitecoreDictionary';
import { IButtonProps } from 'frontend/components/common/Button';

import EditButton from './EditButton';

const createMockProps = (): IButtonProps => ({
    onClick: jest.fn(),
    dataTid: 'amend-dates-edit-button',
});

let mockProps;
let mockStores;

jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useContext: () => mockStores,
}));

const mockButtonProps = jest.fn();
jest.mock('frontend/components/common/Button', () => ({
    __esModule: true,
    default: ({ children, onClick, ...props }) => {
        mockButtonProps(props);

        return (
            <button data-tid={props.dataTid} onClick={onClick}>
                {children}
            </button>
        );
    },
}));

let mockUseMobileViewport = true;
jest.mock('frontend/hooks/useMediaQuery', () => ({
    __esModule: true,
    useMobileViewport: () => mockUseMobileViewport,
}));

describe('<EditButton />', () => {
    beforeEach(() => {
        mockStores = createMockStores();
        mockProps = createMockProps();
    });

    it('Render button and invoke onClick on mobile', () => {
        render(<EditButton {...mockProps} />);

        const button = screen.getByRole('button');

        expect(mockButtonProps).toHaveBeenLastCalledWith(
            expect.objectContaining({
                isLoading: undefined,
                isOutlined: true,
                isFullWidth: true,
                dataTid: mockProps.dataTid,
                isMedium: false,
            }),
        );
        expect(button).toHaveTextContent(SitecoreDictionary.GlobalsButtonsEdit);
        expect(screen.getByTestId('amend-dates-edit-button')).toBeInTheDocument();

        fireEvent.click(button);
        expect(mockProps.onClick).toHaveBeenCalled();
    });

    it('Render button and invoke onClick on desktop', () => {
        mockUseMobileViewport = false;

        render(<EditButton {...mockProps} />);

        const button = screen.getByRole('button');

        expect(mockButtonProps).toHaveBeenLastCalledWith(
            expect.objectContaining({
                isLoading: undefined,
                isOutlined: true,
                isFullWidth: false,
            }),
        );
        expect(button).toHaveTextContent(SitecoreDictionary.GlobalsButtonsEdit);

        fireEvent.click(button);
        expect(mockProps.onClick).toHaveBeenCalled();
    });

    it('Render any property from IButtonProps', () => {
        mockProps.isSmall = true;

        render(<EditButton {...mockProps} />);

        expect(screen.getByRole('button')).toBeInTheDocument();
        expect(mockButtonProps).toHaveBeenCalledWith(
            expect.objectContaining({
                isSmall: true,
            }),
        );
    });

    it('Render medium class for desktop if isLoading is false', () => {
        mockUseMobileViewport = false;

        render(<EditButton {...mockProps} />);

        expect(screen.getByRole('button')).toBeInTheDocument();
        expect(mockButtonProps).toHaveBeenLastCalledWith(
            expect.objectContaining({
                isMedium: true,
            }),
        );
    });

    it('Render children if provided', () => {
        render(<EditButton {...mockProps}>Edit</EditButton>);

        expect(screen.getByRole('button')).toHaveTextContent('Edit');
    });
});
