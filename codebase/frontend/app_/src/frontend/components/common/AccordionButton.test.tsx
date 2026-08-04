import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';

import AccordionButton from './AccordionButton';

jest.mock('frontend/components/icons-new/ChevronDown.tsx', () => ({
    __esModule: true,
    default: ({ className }) => <svg className={className} data-tid='icon-chevron-down' />,
}));

describe('<AccordionButton />', () => {
    const resetMocks = () => ({
        buttonContent: 'Label',
        isExpanded: false,
        onClick: jest.fn(),
        dataTid: 'accordion-button',
        ariaLabel: 'test-aria-label',
    });

    let mocks;

    beforeEach(() => {
        mocks = resetMocks();
    });

    it('Should render button with chevron down', () => {
        const { getByText, getByTestId } = render(<AccordionButton {...mocks} />);
        expect(getByText('Label')).toBeInTheDocument();
        expect(getByTestId('icon-chevron-down').classList.contains('icon--reflect-y')).toBeFalsy();
    });

    it('Should render button with chevron up', () => {
        mocks.isExpanded = true;
        const { getByTestId } = render(<AccordionButton {...mocks} />);
        expect(getByTestId('icon-chevron-down').classList.contains('icon--reflect-y')).toBeTruthy();
    });

    it('Should call func from props on click', () => {
        const { getByTestId } = render(<AccordionButton {...mocks} />);
        fireEvent.click(getByTestId('accordion-button'));
        expect(mocks.onClick).toHaveBeenCalled();
    });

    it('should be rendered with aria-label', () => {
        render(<AccordionButton {...mocks} />);

        expect(screen.getByLabelText('test-aria-label')).toBeInTheDocument();
    });
});
