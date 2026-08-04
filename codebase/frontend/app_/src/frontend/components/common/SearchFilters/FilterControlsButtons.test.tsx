import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import SitecoreDictionary from 'models/enum/SitecoreDictionary';

import FilterControlsButtons from './FilterControlsButtons';

describe('FilterControlsButtons', () => {
    const resetMocks = () =>
        ({
            onApply: jest.fn(),
            onCancel: jest.fn(),
            getPhrase: jest.fn(),
            availableFilters: [{}],
        } as any);

    let mocks = resetMocks();

    beforeEach(() => {
        mocks = resetMocks();
    });

    it('should render', () => {
        render(<FilterControlsButtons {...mocks} />);

        const buttons = screen.getAllByRole('button');
        expect(buttons).toHaveLength(2);
    });

    it('should call getPhrase on render with expected keys', () => {
        render(<FilterControlsButtons {...mocks} />);

        expect(mocks.getPhrase).toHaveBeenCalledWith(SitecoreDictionary.GlobalsButtonsClose);
        expect(mocks.getPhrase).toHaveBeenCalledWith(SitecoreDictionary.GlobalsButtonsApply);
    });

    it('should call onCancel when clicking the close button', async () => {
        render(<FilterControlsButtons {...mocks} />);

        const closeButton = await screen.findByTestId('cancel-filters-btn');
        expect(closeButton).toBeInTheDocument();

        await userEvent.click(closeButton!);
        expect(mocks.onCancel).toHaveBeenCalled();
    });

    it('should call onApply when clicking the apply button', async () => {
        render(<FilterControlsButtons {...mocks} />);

        const applyButton = await screen.findByTestId('apply-filters-btn');
        expect(applyButton).toBeInTheDocument();

        await userEvent.click(applyButton!);
        expect(mocks.onApply).toHaveBeenCalled();
    });
});
