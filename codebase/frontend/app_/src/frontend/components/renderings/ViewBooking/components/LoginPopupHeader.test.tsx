import React from 'react';
import { render, screen } from '@testing-library/react';

import LoginPopupHeader from './LoginPopupHeader';

const createProps = () => ({
    title: 'title',
    description: 'description',
});

let props;

describe('<LoginPopupHeader />', () => {
    beforeEach(() => {
        props = createProps();
    });

    it('Should standard render', () => {
        render(<LoginPopupHeader {...props} />);

        expect(screen.getByTestId('login-popup-header-title')).toBeInTheDocument();
        expect(screen.getByTestId('login-popup-header-description')).toBeInTheDocument();
    });
});
