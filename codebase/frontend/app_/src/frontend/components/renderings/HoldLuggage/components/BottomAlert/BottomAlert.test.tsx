import React from 'react';
import { render, screen } from '@testing-library/react';

import { mockSitecoreField } from 'frontend/utils/tests.utils';

import { BottomAlert, IBottomAlertProps } from './BottomAlert';

const createProps = (): IBottomAlertProps => ({
    text: mockSitecoreField('No extra bags available'),
});

let mockProps = createProps();

describe('BottomAlert', () => {
    beforeEach(() => {
        mockProps = createProps();
    });

    it('should render component', () => {
        render(<BottomAlert {...mockProps} />);

        expect(screen.getByTestId('no-extra-bags-alert')).toBeInTheDocument();
        expect(screen.getByTestId('text')).toHaveTextContent(mockProps.text.value);
        expect(screen.getByTestId('icon')).toBeInTheDocument();
    });
});
