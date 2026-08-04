import React from 'react';
import { render } from '@testing-library/react';

import SitecoreDictionary from 'models/enum/SitecoreDictionary';

import FeedbackSuccessPopup from './FeedbackSuccessPopup';

const createProps = () => ({
    onClose: jest.fn(),
});

const createStores = () => ({
    layoutStore: {
        getPhrase: jest.fn(p => p),
    },
});

let mockProps;
const mockStores = createStores();

jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useContext: () => mockStores,
}));

describe('<FeedbackSuccessPopup />', () => {
    beforeEach(() => {
        mockProps = createProps();
    });

    it('should render component', () => {
        const { container, getByRole, getByText } = render(<FeedbackSuccessPopup {...mockProps} />);

        expect(container.getElementsByClassName('feedback-popup--success').length).toBe(1);
        expect(getByText(SitecoreDictionary.FeedbackPopupLabelsSuccessMessageDescription)).toBeInTheDocument();
        expect(getByRole('heading', { name: SitecoreDictionary.FeedbackPopupLabelsSuccessMessageTitle }));
        expect(getByRole('button', { name: SitecoreDictionary.FeedbackPopupButtonsBackToBooking }));
    });
});
