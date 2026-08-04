import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { createMockStores } from 'frontend/__mocks__';
import { mockSitecoreField } from 'frontend/utils/tests.utils';
import SitecoreDictionary from 'models/enum/SitecoreDictionary';

import AmendEntityPopup, { IAmendEntityPopup } from './AmendEntityPopup';

let mockProps: IAmendEntityPopup;
let mockStores;

jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useContext: () => mockStores,
}));

const mockPopupProps = jest.fn();
jest.mock('frontend/components/common/Popup', () => ({
    __esModule: true,
    Popup: ({ children, ...props }) => {
        mockPopupProps(props);

        return <div data-tid='popup'>{children}</div>;
    },
}));

const mockButtonProps = jest.fn();
jest.mock('frontend/components/common/Button', () => ({
    __esModule: true,
    default: ({ onClick, children, dataTid, ...props }) => {
        mockButtonProps(props);

        return (
            <div data-tid={dataTid} onClick={onClick}>
                {children}
            </div>
        );
    },
}));

describe('<AmendEntityPopup />', () => {
    beforeEach(() => {
        mockProps = {
            children: <div>children</div>,
            onClose: jest.fn(),
            onConfirm: jest.fn(),
            subtitle: mockSitecoreField('subtitle'),
            tidPrefix: 'tidPrefix',
            title: mockSitecoreField('title'),
            contentClassName: 'contentClassName',
        };
        mockStores = createMockStores();
    });

    it('should render component', () => {
        render(<AmendEntityPopup {...mockProps} />);

        expect(screen.getByTestId('popup')).toBeInTheDocument();
        expect(screen.getByTestId('tidPrefix-title')).toHaveTextContent('title');
        expect(screen.getByTestId('tidPrefix-subtitle')).toHaveTextContent('subtitle');
        expect(screen.getByText('children')).toBeInTheDocument();

        expect(screen.getByTestId('tidPrefix-cancel')).toHaveTextContent(SitecoreDictionary.GlobalsButtonsCancel);
        expect(screen.getByTestId('tidPrefix-confirm')).toHaveTextContent(SitecoreDictionary.GlobalsButtonsConfirm);

        expect(mockButtonProps).toHaveBeenCalledWith({
            isMedium: true,
            isTransparent: true,
        });
        expect(mockButtonProps).toHaveBeenCalledWith({
            disabled: undefined,
            isMedium: true,
        });
    });

    it('should call onClose function from props', async () => {
        render(<AmendEntityPopup {...mockProps} />);

        const closeBtn = screen.getByTestId('tidPrefix-cancel');
        await userEvent.click(closeBtn);

        expect(mockProps.onClose).toHaveBeenCalled();
    });

    it('should call onConfirm function from props', async () => {
        render(<AmendEntityPopup {...mockProps} />);

        const confirmBtn = screen.getByTestId('tidPrefix-confirm');
        await userEvent.click(confirmBtn);

        expect(mockProps.onConfirm).toHaveBeenCalled();
    });
});
