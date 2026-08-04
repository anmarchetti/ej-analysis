import React from 'react';
import { render, screen } from '@testing-library/react';

import SitecoreDictionary from 'models/enum/SitecoreDictionary';

import { NetworkIssuesPopup } from './NetworkIssuesPopup';

jest.mock('frontend/components/common/Popup', () => ({
    __esModule: true,
    Popup: ({ children, title }) => (
        <div data-tid='popup'>
            <div>{title}</div>
            <div>{children}</div>
        </div>
    ),
}));

const resetMocks = () => ({
    isNetworkPopupShown: true,
    isEditMode: false,
    getPhrase: jest.fn(p => p),
});

let mocks;

describe('<NetworkIssuesPopup />', () => {
    beforeEach(() => {
        mocks = resetMocks();
    });

    it('should render popup with title and children', () => {
        render(<NetworkIssuesPopup {...mocks} />);

        expect(screen.getByTestId('popup')).toBeInTheDocument();
        expect(screen.getByText(SitecoreDictionary.ConnectivityIssuesLabelsTitle)).toBeInTheDocument();
        expect(screen.getByText(SitecoreDictionary.ConnectivityIssuesLabelsContent)).toBeInTheDocument();
    });

    it('Should NOT render when isEditMode enabled', () => {
        mocks.isEditMode = true;

        const { container } = render(<NetworkIssuesPopup {...mocks} />);

        expect(container).toBeEmptyDOMElement();
    });

    it('Should NOT render when isNetworkPopupShown disabled', () => {
        mocks.isNetworkPopupShown = false;

        const { container } = render(<NetworkIssuesPopup {...mocks} />);

        expect(container).toBeEmptyDOMElement();
    });
});
