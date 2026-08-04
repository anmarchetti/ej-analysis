import React from 'react';
import { render, screen } from '@testing-library/react';

import NoTransfersPopup from './AmendNoTransfersPopup';

const createProps = () => ({
    fields: {
        Title: { value: 'title' },
        Description: { value: 'description' },
        CTA: { value: { href: 'href', text: 'cta' } },
    },
    startDate: 'start',
    onClose: jest.fn(),
});

const createStores = () => ({
    layoutStore: {},
    routerStore: {},
    queryParamStore: {},
    userStore: {},
    appStore: {
        toggleOfferConditions: jest.fn(),
    },
});

let mockProps;
let mockStores = createStores();

jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useContext: () => mockStores,
}));

jest.mock('frontend/components/common/Popup', () => ({
    __esModule: true,
    Popup: ({ id, children }) => <div data-tid={id}>{children}</div>,
}));

describe('<NoTransfersPopup />', () => {
    beforeEach(() => {
        mockProps = createProps();
        mockStores = createStores();
    });

    it('should NOT render if no fields', () => {
        mockProps.fields = null;
        const { container } = render(<NoTransfersPopup {...mockProps} />);

        expect(container).toBeEmptyDOMElement();
    });

    it('should render popup', () => {
        render(<NoTransfersPopup {...mockProps} />);

        expect(screen.getByTestId('amend-no-transfer-popup-body')).toBeInTheDocument();
    });

    it('should render title', () => {
        render(<NoTransfersPopup {...mockProps} />);

        expect(screen.getByTestId('amend-no-transfer-popup-title')).toHaveTextContent('title');
    });

    it('should NOT render title if title field not provided', () => {
        mockProps.fields.Title = null;
        render(<NoTransfersPopup {...mockProps} />);

        expect(screen.queryByRole('heading')).not.toBeInTheDocument();
    });

    it('should render description', () => {
        render(<NoTransfersPopup {...mockProps} />);

        expect(screen.getByTestId('amend-no-transfer-popup-description')).toBeInTheDocument();
    });

    it('should NOT render description if description field not provided', () => {
        mockProps.fields.Description = null;
        render(<NoTransfersPopup {...mockProps} />);

        expect(screen.queryByTestId('amend-no-transfer-popup-description')).not.toBeInTheDocument();
    });

    it('should render CTA', () => {
        render(<NoTransfersPopup {...mockProps} />);

        expect(screen.getByTestId('amend-no-transfer-popup-cta')).toHaveTextContent('cta');
    });

    it('should NOT render cta if cta field not provided', () => {
        mockProps.fields.CTA = null;
        render(<NoTransfersPopup {...mockProps} />);

        expect(screen.queryByTestId('amend-no-transfer-popup-cta')).not.toBeInTheDocument();
    });
});
