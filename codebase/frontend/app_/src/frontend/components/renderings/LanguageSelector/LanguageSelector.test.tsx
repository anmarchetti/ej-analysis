import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import isBackend from 'frontend/utils/isBackend';
import SitecoreDictionary from 'models/enum/SitecoreDictionary';

import { mockSitecoreLangOption } from './__mocks__/languageSelector.mocks';
import LanguageSelector from './LanguageSelector';

jest.mock('frontend/utils/isBackend', () => jest.fn());
const mockIsBackend = isBackend as jest.MockedFn<typeof isBackend>;

const mockLanguageSelectorPopupProps = jest.fn();
jest.mock('./components/LanguageSelectorPopup/LanguageSelectorPopup', () => ({ onClose, ...props }) => {
    mockLanguageSelectorPopupProps(props);

    return (
        <div data-tid='language-selector-popup'>
            <button onClick={onClose}>Close Popup</button>
        </div>
    );
});

const createStores = () => ({
    layoutStore: {
        getPhrase: jest.fn(p => p),
        lang: 'en',
    },
});

const createProps = () => ({
    fields: {
        PopUpTitle: { value: 'PopUpTitle' },
        PopUpSubtitle: { value: 'PopUpSubtitle' },
        Items: [mockSitecoreLangOption('en'), mockSitecoreLangOption('ch-fr')],
    },
});

let mockStores = createStores();
let mockProps = createProps();

jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useContext: () => mockStores,
}));

jest.mock('frontend/components/common/JSSImageNext/JSSImageNext', () => ({
    __esModule: true,
    JSSImageNext: () => <div data-tid='jss-next-image' />,
}));

describe('LanguageSelector', () => {
    beforeEach(() => {
        mockProps = createProps();
        mockStores = createStores();
    });

    it('Should render button and popup', () => {
        render(<LanguageSelector {...mockProps} />);

        const button = screen.getByRole('button', { name: SitecoreDictionary.GlobalsLabelsChooseLanguage });

        expect(button).toHaveAttribute('aria-haspopup', 'dialog');
        expect(button).toHaveAttribute('aria-expanded', 'false');
        expect(mockLanguageSelectorPopupProps).toHaveBeenCalledWith({
            isOpen: false,
            items: mockProps.fields.Items,
            title: mockProps.fields.PopUpTitle.value,
            subtitle: mockProps.fields.PopUpSubtitle.value,
        });
    });

    it('Should not render anything when no items', () => {
        mockProps.fields.Items = undefined as any;

        const { container } = render(<LanguageSelector {...mockProps} />);

        expect(container).toBeEmptyDOMElement();
    });

    it('Should render only button when only one item', () => {
        mockProps.fields.Items = [{ ...mockProps.fields.Items[0] }];

        render(<LanguageSelector {...mockProps} />);

        const button = screen.getByRole('button', { name: SitecoreDictionary.GlobalsLabelsChooseLanguage });

        expect(button).not.toHaveAttribute('aria-haspopup');
        expect(button).not.toHaveAttribute('aria-expanded');
        expect(mockLanguageSelectorPopupProps).not.toHaveBeenCalled();
    });

    it('Should not render popup when isBackend', () => {
        mockIsBackend.mockReturnValueOnce(true);

        render(<LanguageSelector {...mockProps} />);

        expect(mockLanguageSelectorPopupProps).not.toHaveBeenCalled();
    });

    it('Should toggle popup', async () => {
        render(<LanguageSelector {...mockProps} />);

        expect(mockLanguageSelectorPopupProps).toHaveBeenCalledWith(
            expect.objectContaining({
                isOpen: false,
            }),
        );

        await userEvent.click(screen.getByRole('button', { name: SitecoreDictionary.GlobalsLabelsChooseLanguage }));

        expect(mockLanguageSelectorPopupProps).toHaveBeenCalledWith(
            expect.objectContaining({
                isOpen: true,
            }),
        );

        await userEvent.click(screen.getByRole('button', { name: 'Close Popup' }));

        expect(mockLanguageSelectorPopupProps).toHaveBeenCalledWith(
            expect.objectContaining({
                isOpen: false,
            }),
        );
    });
});
