import React from 'react';
import { render, screen } from '@testing-library/react';

import { SitecorePopup } from './SitecorePopup';

jest.mock('frontend/components/common/Popup', () => ({
    __esModule: true,
    Popup: ({ footerContent, children }) => (
        <div data-tid='popup'>
            <div>{footerContent}</div>
            <div>{children}</div>
        </div>
    ),
}));

const resetMocks = () => ({
    itemId: 'id',
    onClose: jest.fn(),
});

let mocks;

describe('<SitecorePopup />', () => {
    beforeEach(() => {
        mocks = resetMocks();
    });

    it('should standard render', () => {
        render(<SitecorePopup {...mocks} />);

        expect(screen.getByTestId('popup')).toBeInTheDocument();
        expect(screen.getByRole('button')).toBeInTheDocument();
    });
});
