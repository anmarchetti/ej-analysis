import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';

import PopupCloseButton from 'frontend/components/common/Popup/PopupCloseButton';

jest.mock('truncate-html', () => jest.fn((str, options) => `${str.substr(0, options.length)}...`));

const createProps = () => ({
    onClick: jest.fn(),
});
const createStores = () => ({
    appStore: { isScreenLessMedium: false },
    layoutStore: { getPhrase: jest.fn() },
    routerStore: {},
});

let props;
let mockStores = createStores();

jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useContext: () => mockStores,
}));

describe('<PopupCloseButton />', () => {
    beforeEach(() => {
        props = createProps();
        mockStores = createStores();
    });

    it('Should call callback on click', () => {
        render(<PopupCloseButton {...props} />);
        const button = screen.queryByRole('button');
        button && fireEvent.click(button);
        expect(props.onClick).toBeCalled();
    });

    it('Should add class to button', () => {
        const className = 'testClass';
        render(<PopupCloseButton {...props} className={className} />);

        expect(screen.getByRole('button').classList.contains(className)).toBeTruthy();
    });
});
