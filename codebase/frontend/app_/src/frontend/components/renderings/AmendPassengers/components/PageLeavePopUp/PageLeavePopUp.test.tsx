import React from 'react';
import { fireEvent, render } from '@testing-library/react';

import SitecoreDictionary from 'models/enum/SitecoreDictionary';
import { IAmendPassengersFields } from 'frontend/components/renderings/AmendPassengers/AmendPassengers';

import { PageLeavePopUp } from './PageLeavePopUp';

const fields = {
    HeaderBackText: { value: 'Back' },
    UnsavedPopupTitle: { value: 'Unsaved Changes' },
    UnsavedPopupSubtext: { value: 'You have unsaved changes. Are you sure you want to leave?' },
} as IAmendPassengersFields;
const onSave = jest.fn();
const onCancel = jest.fn();
const onClose = jest.fn();

const generateProps = () => ({
    fields,
    onSave,
    onCancel,
    onClose,
    isLoading: false,
});

const createStores = () => ({
    layoutStore: { getPhrase: jest.fn(p => p) },
    appStore: {
        isScreenLessMedium: false,
    },
    tracking: {
        onUnSavedPassengerNotify: jest.fn(),
    },
});

let props = generateProps();
let mockStores = createStores();

jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useContext: () => mockStores,
}));

describe('PageLeavePopUp', () => {
    afterEach(() => {
        props = generateProps();
        mockStores = createStores();
    });

    it('renders the component', () => {
        const { getByText } = render(<PageLeavePopUp {...props} />);
        expect(getByText('Back')).toBeInTheDocument();
        expect(getByText('Unsaved Changes')).toBeInTheDocument();
        expect(getByText('You have unsaved changes. Are you sure you want to leave?')).toBeInTheDocument();
        expect(getByText(SitecoreDictionary.GlobalsButtonsCancelChanges)).toBeInTheDocument();
        expect(getByText(SitecoreDictionary.GlobalsButtonsSaveChanges)).toBeInTheDocument();
        expect(mockStores.tracking.onUnSavedPassengerNotify).toBeCalledWith(
            'You have unsaved changes. Are you sure you want to leave?',
        );
    });

    it('calls the onSave function when save button is clicked', () => {
        const { getByText } = render(<PageLeavePopUp {...props} />);
        fireEvent.click(getByText(SitecoreDictionary.GlobalsButtonsSaveChanges));
        expect(onSave).toHaveBeenCalledTimes(1);
    });

    it('calls the onCancel function when cancel button is clicked', () => {
        const { getByText } = render(<PageLeavePopUp {...props} />);
        fireEvent.click(getByText(SitecoreDictionary.GlobalsButtonsCancelChanges));
        expect(onCancel).toHaveBeenCalledTimes(1);
    });

    it('calls the onClose function when header back button is clicked', () => {
        const { getByText } = render(<PageLeavePopUp {...props} />);
        fireEvent.click(getByText('Back'));
        expect(onClose).toHaveBeenCalledTimes(1);
    });

    it('renders as outlined when isScreenLessMedium is false', () => {
        const { getByText } = render(<PageLeavePopUp {...props} />);

        expect(getByText(SitecoreDictionary.GlobalsButtonsCancelChanges)).toHaveClass('btn--outlined');
        expect(getByText(SitecoreDictionary.GlobalsButtonsCancelChanges)).not.toHaveClass('btn--transparent');
    });

    it('renders as transparent when isScreenLessMedium is true', () => {
        mockStores.appStore.isScreenLessMedium = true;
        const { getByText } = render(<PageLeavePopUp {...props} />);

        expect(getByText(SitecoreDictionary.GlobalsButtonsCancelChanges)).toHaveClass('btn--transparent');
        expect(getByText(SitecoreDictionary.GlobalsButtonsCancelChanges)).not.toHaveClass('btn--outlined');
    });
});
