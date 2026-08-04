import React from 'react';
import { render, screen } from '@testing-library/react';

import { mockSitecoreField } from 'frontend/utils/tests.utils';

import ContactFromFieldset, { IContactFromFieldsetProps } from './ContactFromFieldset';

const createProps = (): IContactFromFieldsetProps => ({
    title: mockSitecoreField('title'),
    titleTid: 'titleTid',
    children: <div data-tid='children' />,
    className: 'className',
});

let mockProps;

describe('ContactFromFieldset', () => {
    beforeEach(() => {
        mockProps = createProps();
    });

    it('should render the fieldset with the correct className', () => {
        render(<ContactFromFieldset {...mockProps} />);
        const fieldset = screen.getByRole('group');
        expect(fieldset).toHaveClass('fieldset');
        expect(fieldset).toHaveClass(mockProps.className);
    });

    it('should render the legend when title is provided', () => {
        render(<ContactFromFieldset {...mockProps} />);
        const legend = screen.getByTestId(mockProps.titleTid);
        expect(legend).toBeInTheDocument();
        expect(legend).toHaveTextContent(mockProps.title.value);
    });

    it('should NOT render the legend when title is not provided', () => {
        mockProps.title = undefined;
        render(<ContactFromFieldset {...mockProps} />);
        const legend = screen.queryByTestId(mockProps.titleTid);
        expect(legend).not.toBeInTheDocument();
    });

    it('should render children inside the fieldset', () => {
        render(<ContactFromFieldset {...mockProps} />);
        const children = screen.getByTestId('children');
        expect(children).toBeInTheDocument();
    });
});
