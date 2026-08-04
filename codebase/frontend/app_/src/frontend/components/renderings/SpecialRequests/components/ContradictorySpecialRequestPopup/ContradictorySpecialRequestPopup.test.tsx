import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import SitecoreDictionary from 'models/enum/SitecoreDictionary';

import { ContradictorySpecialRequestPopup } from './ContradictorySpecialRequestPopup';

const fields = {
    ContradictoryPopupTitle: {
        value: 'title',
    },
    ContradictoryPopupDescription: {
        value: 'description',
    },
};

const contrOptions = {
    currentOption: {
        code: 'ABC',
        groupCode: 'gc',
        name: 'Double bed',
    },
    newOption: {
        code: 'ABCD',
        groupCode: 'gc',
        name: 'Single bed',
    },
};

const createStores = () => ({
    layoutStore: { getPhrase: jest.fn(p => p), setIsBodyScrollLocked: jest.fn() },
    viewBookingStore: { booking: { bookingReference: 'bookingReference' } },
    tracking: {
        contradictionToggleSpecialRequests: jest.fn(),
    },
});

const mockStores = createStores();

jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useContext: () => mockStores,
}));

describe('<ContradictorySpecialRequestPopup />', () => {
    it('Should be null without options', () => {
        const { container } = render(
            <ContradictorySpecialRequestPopup
                fields={fields}
                contradictoryOptions={null}
                onCancel={jest.fn()}
                onSubmit={jest.fn()}
            />,
        );
        expect(container).toBeEmptyDOMElement();
    });

    it('Should be visible with options, and display options name', () => {
        render(
            <ContradictorySpecialRequestPopup
                fields={fields}
                contradictoryOptions={contrOptions}
                onCancel={jest.fn()}
                onSubmit={jest.fn()}
            />,
        );
        expect(screen.getByText(contrOptions.currentOption.name)).toBeInTheDocument();
        expect(screen.getByText(contrOptions.newOption.name)).toBeInTheDocument();
    });

    it('Should call cancel cb on cancel button click', async () => {
        const onCancel = jest.fn();

        const view = render(
            <ContradictorySpecialRequestPopup
                fields={fields}
                contradictoryOptions={contrOptions}
                onCancel={onCancel}
                onSubmit={jest.fn()}
            />,
        );
        const button = view.getByText(SitecoreDictionary.GlobalsButtonsContradictoryKeepOriginal);
        await userEvent.click(button);

        expect(onCancel).toBeCalled();
    });

    it('Should deselect old and select new option on submit and call hide', async () => {
        const onSubmit = jest.fn();
        const onCancel = jest.fn();

        const view = render(
            <ContradictorySpecialRequestPopup
                fields={fields}
                contradictoryOptions={contrOptions}
                onCancel={onCancel}
                onSubmit={onSubmit}
            />,
        );
        const button = view.getByText(SitecoreDictionary.GlobalsButtonsContradictoryContinueWithNew);
        await userEvent.click(button);
        expect(onSubmit.mock.calls).toEqual([[contrOptions.newOption.code, contrOptions.currentOption.code]]);
        expect(onCancel).toBeCalled();
    });
});
