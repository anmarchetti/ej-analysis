import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';

import { createMockStores } from 'frontend/__mocks__';

import PassengerDetailsAction from './PassengerDetailsAction';

jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useContext: () => mockStores,
}));

const mockButtonProps = jest.fn();
jest.mock('frontend/components/common/Button', () => ({
    __esModule: true,
    default: ({ onClick, ...props }) => {
        mockButtonProps(props);

        return <button data-tid='button' onClick={onClick} />;
    },
}));

const createProps = () => ({
    onClick: jest.fn(),
    className: 'test-class',
});
const createStores = () =>
    createMockStores({
        amendPassengerStore: {
            isAmendCTADisabled: false,
        },
    });

let mockStores;
let currentProps;

describe('<PassengerDetailsAction />', () => {
    beforeEach(() => {
        currentProps = createProps();
        mockStores = createStores();
    });

    it('Should render props and clickable', () => {
        render(<PassengerDetailsAction {...currentProps} />);
        expect(screen.getByTestId('passenger-details-action')).toHaveClass('test-class');
        fireEvent.click(screen.getByTestId('button'));

        expect(mockButtonProps).toHaveBeenCalledWith(
            expect.objectContaining({
                isOutlined: true,
                isSmall: true,
                dataTid: 'passengers-details-entry-cta',
                disabled: false,
                children: 'AmendPassenger.Buttons.EditPassenger',
            }),
        );
        expect(currentProps.onClick).toHaveBeenCalled();
    });

    it('Should render disabled button', () => {
        mockStores.amendPassengerStore.isAmendCTADisabled = true;
        render(<PassengerDetailsAction {...currentProps} />);

        expect(mockButtonProps).toHaveBeenCalledWith(
            expect.objectContaining({
                disabled: true,
            }),
        );
    });
});
