import React from 'react';
import { waitFor } from '@testing-library/dom';
import { render, screen } from '@testing-library/react';

import { DynamicFlatPicker } from './FlatPickerDynamic';

const mockFlaPickerComponent = jest.fn();
jest.mock('./FlatPicker', () => ({
    __esModule: true,
    default: () => {
        mockFlaPickerComponent();

        return null;
    },
}));

jest.mock('next/dynamic', () => ({
    __esModule: true,
    default: importFunc => () => {
        importFunc().then(FlatPickerComponent => {
            FlatPickerComponent();
        });

        return <div data-tid='dynamic' />;
    },
}));

describe('<FlatPickerDynamic />', () => {
    it('Should render component', () => {
        render(<DynamicFlatPicker />);

        expect(screen.getByTestId('dynamic')).toBeInTheDocument();
        waitFor(() => expect(mockFlaPickerComponent).toHaveBeenCalled());
    });
});
