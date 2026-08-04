import React from 'react';
import { render, screen } from '@testing-library/react';

import { mockSitecoreField } from 'frontend/utils/tests.utils';
import SubmittedFeedbackForm, {
    ISubmittedFeedbackFormProps,
} from 'frontend/components/renderings/TradePortalFeedback/components/SubmittedFeedbackForm';

jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useContext: () => mockStores,
}));

jest.mock('frontend/components/renderings/static/ComponentWrapper', () => ({
    __esModule: true,
    default: ({ children }) => <div data-tid='component-wrapper'>{children}</div>,
}));

jest.mock('@sitecore-jss/sitecore-jss-nextjs', () => ({
    __esModule: true,
    Text: ({ className }) => <div data-tid='sitecore-text' className={className} />,
}));

jest.mock('frontend/components/common/RichTextWithLinks', () => ({
    __esModule: true,
    default: ({ className }) => <div data-tid='richtext-with-links' className={className} />,
}));

jest.mock('frontend/components/common/Button', () => ({
    __esModule: true,
    default: () => <button data-tid='button' />,
}));

const resetMocks = () =>
    ({
        fields: {
            ConfirmationTitle: mockSitecoreField('Title'),
            ConfirmationSubtitle: mockSitecoreField('Description'),
            ConfirmationButton: mockSitecoreField('Button'),
        },
    } as ISubmittedFeedbackFormProps);

const createStores = () => ({
    routerStore: {
        redirectToHomePage: jest.fn(),
    },
});

let props;
let mockStores;

describe('<SubmittedFeedbackForm />', () => {
    beforeEach(() => {
        props = resetMocks();
        mockStores = createStores();
    });

    it('Should render SubmittedFeedbackForm', () => {
        const { container } = render(<SubmittedFeedbackForm {...props} />);

        expect(screen.getAllByTestId('component-wrapper').length).toBe(2);
        expect(container.querySelector('.feedback-form__title')).toBeInTheDocument();
        expect(screen.getByTestId('sitecore-text')).toBeInTheDocument();
        expect(container.querySelector('.feedback-form__subtitle')).toBeInTheDocument();
        expect(screen.getByTestId('richtext-with-links')).toBeInTheDocument();
        expect(screen.getByRole('button')).toBeInTheDocument();
    });
});
