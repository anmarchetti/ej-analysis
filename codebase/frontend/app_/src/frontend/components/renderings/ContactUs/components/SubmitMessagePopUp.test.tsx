import React from 'react';
import { render } from '@testing-library/react';

import SubmitMessagePopUp, {
    ISumbitMessagePopupProps,
} from 'frontend/components/renderings/ContactUs/components/SubmitMessagePopUp';

const createProps = (): ISumbitMessagePopupProps => ({
    isSuccess: true,
    submitPopupContent: {
        SuccessTitleWithCaseNumber: { value: 'Success Title New' },
        SuccessTextWithCaseNumber: { value: 'Success Text New' },
        SuccessTitle: { value: 'Success Title' },
        SuccessText: { value: 'Success Text' },
        FailedTitle: { value: 'Failed Title' },
        FailedText: { value: 'Failed Text' },
    },
    closeSubmitMessage: jest.fn(),
});

const createStores = () => ({
    layoutStore: {
        getPhrase: jest.fn(),
    },
    routerStore: {
        redirectTo: jest.fn(),
    },
    caseNumber: '',
    appStore: {
        toggleOfferConditions: jest.fn(),
    },
});

let mockProps;
const mockStores = createStores();

jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useContext: () => mockStores,
}));

describe('SubmitMessagePopUp', () => {
    beforeEach(() => {
        mockProps = createProps();
    });

    it('should render successful message without caseNumber', () => {
        const { getByText } = render(<SubmitMessagePopUp {...mockProps} />);

        expect(getByText('Success Title')).toBeInTheDocument();
        expect(getByText('Success Text')).toBeInTheDocument();
    });

    it('should render successful message with caseNumber', () => {
        mockStores.caseNumber = '1235';
        const { getByText } = render(<SubmitMessagePopUp {...mockProps} />);

        expect(getByText('Success Title New')).toBeInTheDocument();
        expect(getByText('Success Text New')).toBeInTheDocument();
    });

    it('should render failed message', () => {
        mockProps.isSuccess = false;

        const { getByText } = render(<SubmitMessagePopUp {...mockProps} />);

        expect(getByText('Failed Title')).toBeInTheDocument();
        expect(getByText('Failed Text')).toBeInTheDocument();
    });

    it('should render failed message without caseNumber', () => {
        mockProps.isSuccess = false;

        const { getByText, queryByText } = render(<SubmitMessagePopUp {...mockProps} />);

        expect(getByText('Failed Title')).toBeInTheDocument();
        expect(getByText('Failed Text')).toBeInTheDocument();
        expect(queryByText('1235')).toBeNull();
    });
});
