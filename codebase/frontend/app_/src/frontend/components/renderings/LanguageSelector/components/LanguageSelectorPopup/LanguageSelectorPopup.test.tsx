import React from 'react';
import { render, screen } from '@testing-library/react';

import { mockSitecoreLangOption } from 'frontend/components/renderings/LanguageSelector/__mocks__/languageSelector.mocks';

import LanguageSelectorPopup from './LanguageSelectorPopup';

jest.mock('frontend/components/common/Drawer', () => () => <div data-tid='drawer' />);
jest.mock('frontend/components/common/Popup', () => ({
    Popup: () => <div data-tid='popup' />,
}));

const createStores = () => ({
    appStore: {
        isScreenLarge: true,
    },
});

const createProps = () => ({
    isOpen: true,
    items: [mockSitecoreLangOption('en'), mockSitecoreLangOption('ch-fr')],
    title: 'title',
    subtitle: 'subtitle',
    onClose: jest.fn(),
});

let mockStores = createStores();
let mocksProps = createProps();

jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useContext: () => mockStores,
}));

describe('LanguageSelectorPopup', () => {
    beforeEach(() => {
        mocksProps = createProps();
        mockStores = createStores();
    });

    describe('desktop', () => {
        it('should render Popup when opened', () => {
            render(<LanguageSelectorPopup {...mocksProps} />);

            expect(screen.getByTestId('popup')).toBeInTheDocument();
        });

        it('should be empty render when not opened ', () => {
            mocksProps.isOpen = false;

            const { container } = render(<LanguageSelectorPopup {...mocksProps} />);

            expect(container).toBeEmptyDOMElement();
        });
    });

    describe('mobile', () => {
        it('should render Drawer when screen is small', () => {
            mockStores.appStore.isScreenLarge = false;

            render(<LanguageSelectorPopup {...mocksProps} />);

            expect(screen.getByTestId('drawer')).toBeInTheDocument();
        });
    });
});
