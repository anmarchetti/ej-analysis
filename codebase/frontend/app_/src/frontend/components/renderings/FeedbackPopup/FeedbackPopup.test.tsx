import React from 'react';
import { render } from '@testing-library/react';

import FeedbackPopup from './FeedbackPopup';

const createProps = () => ({
    fields: {
        Title: { value: 'title' },
        ScaleTitle: { value: 'scale title' },
        Scale: [
            {
                id: '1',
                fields: {
                    Name: { value: 'field' },
                    Icon: { value: { src: 'icon' } },
                    ScaleValue: { value: 1 },
                },
                url: 'url1',
            },
        ],
        IsCommentFieldEnabled: { value: false },
        CommentTitle: { value: 'comment title' },
        Delay: { value: null },
    },
});

const createStores = () => ({
    layoutStore: {
        getPhrase: jest.fn(),
    },
    appStore: { isScreenMedium: true },
    trackingStore: { trackEventWithParams: jest.fn() },
});

let mockProps;
let mockStores = createStores();

jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useContext: () => mockStores,
}));

jest.mock('./components/FeedbackForm', () => () => <div data-tid='form' />);

jest.mock('frontend/components/common/Drawer', () => () => <div data-tid='drawer' />);

describe('<DealsPromoTile />', () => {
    beforeEach(() => {
        mockProps = createProps();
        mockStores = createStores();
    });

    it('should NOT render', async () => {
        mockProps.fields = null;
        const { container } = render(<FeedbackPopup {...mockProps} />);

        expect(container).toBeEmptyDOMElement();
    });

    it('should render popup with FeedbackForm', () => {
        const { container, getByTestId, queryByTestId } = render(<FeedbackPopup {...mockProps} />);

        expect(container.getElementsByClassName('feedback-popup').length).toBe(1);
        expect(getByTestId('form')).toBeInTheDocument();
        expect(queryByTestId('drawer')).not.toBeInTheDocument();
    });

    it('should render popup with subtitle, drawer', () => {
        mockStores.appStore.isScreenMedium = false;
        const { container, getByTestId, getByRole } = render(<FeedbackPopup {...mockProps} />);

        expect(container.getElementsByClassName('feedback-popup').length).toBe(1);
        expect(getByRole('heading', { name: 'title' }));
        expect(getByTestId('drawer')).toBeInTheDocument();
    });

    it('should render popup with drawer without subtitle', () => {
        mockStores.appStore.isScreenMedium = false;
        mockProps.fields.Title = null;
        const { container, getByTestId, queryByRole } = render(<FeedbackPopup {...mockProps} />);

        expect(container.getElementsByClassName('feedback-popup').length).toBe(1);
        expect(queryByRole('heading', { name: 'title' })).not.toBeInTheDocument();
        expect(getByTestId('drawer')).toBeInTheDocument();
    });
});
