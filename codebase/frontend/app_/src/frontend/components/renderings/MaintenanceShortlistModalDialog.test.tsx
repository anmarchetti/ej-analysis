import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { mockSitecoreField, mockSitecoreImageField } from 'frontend/utils/tests.utils';

import {
    MaintenanceShortlistModalDialog,
    TMaintenanceShortlistModalDialogProps,
} from './MaintenanceShortlistModalDialog';

const mockModalDialog = jest.fn();
jest.mock('frontend/components/renderings/ModalDialog', () => ({ onClose, ...props }) => {
    mockModalDialog(props);

    return <button data-tid='modal-dialog' onClick={onClose} onKeyDown={jest.fn()} />;
});

const resetMocks = () =>
    ({
        fields: {
            Title: mockSitecoreField('Title'),
            Icon: mockSitecoreField(mockSitecoreImageField('src')),
            Description: mockSitecoreField('Description'),
        },
        params: {},
        rendering: {},
    } as TMaintenanceShortlistModalDialogProps);

const createStores = () => ({
    layoutStore: { isFullMaintenance: true },
    shortlistStore: {
        isShowLoginPopup: true,
        toggleShowLoginPopup: jest.fn(),
    },
});

jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useContext: () => mockStores,
}));

let props;
let mockStores;

describe('<MaintenanceShortlistModalDialog />', () => {
    beforeEach(() => {
        props = resetMocks();
        mockStores = createStores();
    });

    it('should NOT render component when isFullMaintenance is false', () => {
        mockStores.layoutStore.isFullMaintenance = false;

        const { container } = render(<MaintenanceShortlistModalDialog {...props} />);

        expect(container).toBeEmptyDOMElement();
    });

    it('should render ModalDialog', () => {
        render(<MaintenanceShortlistModalDialog {...props} />);

        expect(screen.getByTestId('modal-dialog')).toBeInTheDocument();
        expect(mockModalDialog).toHaveBeenCalledWith({
            ...props,
            isShowPopup: true,
        });
    });

    it('should call toggleShowLoginPopup on ModalDialog close', async () => {
        render(<MaintenanceShortlistModalDialog {...props} />);

        await userEvent.click(screen.getByTestId('modal-dialog'));

        expect(mockStores.shortlistStore.toggleShowLoginPopup).toHaveBeenCalledWith(false);
    });
});
