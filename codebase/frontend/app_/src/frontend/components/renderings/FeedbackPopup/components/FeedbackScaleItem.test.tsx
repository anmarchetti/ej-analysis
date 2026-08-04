import React from 'react';
import { render } from '@testing-library/react';

import FeedbackScaleItem from './FeedbackScaleItem';

const createProps = () => ({
    fields: {
        Title: { value: 'Test' },
        Icon: { value: { src: 'icon' } },
        ScaleValue: { value: 1 },
    },
    checked: false,
    radioGroupName: 'radio',
    onChange: jest.fn(),
});

const createStores = () => ({
    layoutStore: {
        isEditMode: false,
        getPhrase: jest.fn(),
        sitePath: 'path',
    },
    appStore: { isScreenLessMedium: false },
});

let mockProps;
let mockStores = createStores();

jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useContext: () => mockStores,
}));

describe('<FeedbackScaleItem />', () => {
    beforeEach(() => {
        mockProps = createProps();
        mockStores = createStores();
    });

    it('should NOT render if no fields', () => {
        mockProps.fields = null;
        const { container } = render(<FeedbackScaleItem {...mockProps} />);

        expect(container).toBeEmptyDOMElement();
    });

    it('should NOT render if wrong scale value', () => {
        mockProps.fields.ScaleValue = null;
        const { container } = render(<FeedbackScaleItem {...mockProps} />);

        expect(container).toBeEmptyDOMElement();
    });

    it('should render selected scale item if checked', () => {
        mockProps.checked = true;
        const { container } = render(<FeedbackScaleItem {...mockProps} />);

        expect(container.getElementsByClassName('feedback-scale-item--selected').length).toBe(1);
    });

    it('should NOT render selected scale item if not checked', () => {
        const { container } = render(<FeedbackScaleItem {...mockProps} />);

        expect(container.getElementsByClassName('feedback-scale-item--selected').length).toBe(0);
    });

    it('should render icon', () => {
        const { container } = render(<FeedbackScaleItem {...mockProps} />);

        expect(container.getElementsByClassName('feedback-scale-item__icon').length).toBe(1);
    });

    it('should NOT render icon', () => {
        mockProps.fields.Icon.value.src = null;
        const { container } = render(<FeedbackScaleItem {...mockProps} />);

        expect(container.getElementsByClassName('feedback-scale-item__icon').length).toBe(0);
    });
});
