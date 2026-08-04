import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { createMockStores } from 'frontend/__mocks__';
import SitecoreDictionary from 'models/enum/SitecoreDictionary';
import { EventTypes } from 'models/enum/tracking/EventTypes';
import { EventActions, EventCategories, GENERIC_CUSTOM_PARAMS_EMPTY } from 'models/enum/tracking/GenericEventParams';
import { mockSitecoreLangOption } from 'frontend/components/renderings/LanguageSelector/__mocks__/languageSelector.mocks';

import LanguageSelectorForm from './LanguageSelectorForm';

const createProps = () => ({
    title: 'title',
    subtitle: 'subtitle',
    items: [mockSitecoreLangOption('en'), mockSitecoreLangOption('ch-fr')],
    onClose: jest.fn(),
});

const createStores = () =>
    createMockStores({
        layoutStore: {
            lang: 'en',
            isHomePage: true,
        },
        routerStore: {
            switchToNewLanguage: jest.fn(),
        },
        trackingStore: {
            trackEventWithParams: jest.fn(),
        },
    });

let mockProps = createProps();
let mockStores = createStores();

jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useContext: () => mockStores,
}));

describe('<LanguageSelectorForm />', () => {
    beforeEach(() => {
        mockProps = createProps();
        mockStores = createStores();
    });

    it('Should render form', () => {
        render(<LanguageSelectorForm {...mockProps} />);

        expect(screen.getByRole('heading', { level: 2 })).toHaveTextContent(mockProps.title);
        expect(screen.getByRole('heading', { level: 3 })).toHaveTextContent(mockProps.subtitle);
        expect(screen.getAllByRole('radio')).toHaveLength(mockProps.items.length);
        expect(screen.getByRole('button', { name: SitecoreDictionary.GlobalsButtonsApply })).toBeDisabled();
        expect(screen.getByRole('button', { name: SitecoreDictionary.GlobalsButtonsClose })).toBeVisible();
    });

    it('Should select new language', async () => {
        render(<LanguageSelectorForm {...mockProps} />);

        const enRadio = screen.getByRole('radio', { name: 'en' });
        const frRadio = screen.getByRole('radio', { name: 'ch-fr' });

        expect(enRadio).toBeChecked();
        expect(frRadio).not.toBeChecked();

        await userEvent.click(frRadio);

        expect(enRadio).not.toBeChecked();
        expect(frRadio).toBeChecked();
        expect(screen.getByRole('button', { name: SitecoreDictionary.GlobalsButtonsApply })).toBeEnabled();
    });

    it('Should apply new language', async () => {
        render(<LanguageSelectorForm {...mockProps} />);

        await userEvent.click(screen.getByRole('radio', { name: 'ch-fr' }));
        await userEvent.click(screen.getByRole('button', { name: SitecoreDictionary.GlobalsButtonsApply }));

        expect(mockStores.routerStore.switchToNewLanguage).toHaveBeenCalledWith('ch-fr');
    });

    it('Should close form', async () => {
        render(<LanguageSelectorForm {...mockProps} />);

        await userEvent.click(screen.getByRole('button', { name: SitecoreDictionary.GlobalsButtonsClose }));

        expect(mockProps.onClose).toHaveBeenCalled();
    });

    it('Should not render title', () => {
        mockProps.title = undefined as any;

        render(<LanguageSelectorForm {...mockProps} />);

        expect(screen.queryByRole('heading', { level: 2 })).not.toBeInTheDocument();
    });

    it('Should not render subtitle', () => {
        mockProps.subtitle = undefined as any;

        render(<LanguageSelectorForm {...mockProps} />);

        expect(screen.queryByRole('heading', { level: 3 })).not.toBeInTheDocument();
    });

    it('Should call trackEventWithParams function with eventAction Market Selection when market was changed', async () => {
        render(<LanguageSelectorForm {...mockProps} />);

        await userEvent.click(screen.getByRole('radio', { name: 'ch-fr' }));
        await userEvent.click(screen.getByRole('button', { name: SitecoreDictionary.GlobalsButtonsApply }));

        expect(mockStores.trackingStore.trackEventWithParams).toHaveBeenCalledWith(
            EventTypes.GenericEvent,
            {
                eventAction: EventActions.MarketSelection,
                eventCategory: EventCategories.NavigationBarMenu,
                eventLabel: 'FR-CH',
                eventType: EventTypes.Interaction,
            },
            GENERIC_CUSTOM_PARAMS_EMPTY,
        );
    });

    it('Should call trackEventWithParams function with eventAction Language Selection when language was changed', async () => {
        mockStores.layoutStore.isHomePage = false;
        render(<LanguageSelectorForm {...mockProps} />);

        await userEvent.click(screen.getByRole('radio', { name: 'ch-fr' }));
        await userEvent.click(screen.getByRole('button', { name: SitecoreDictionary.GlobalsButtonsApply }));

        expect(mockStores.trackingStore.trackEventWithParams).toHaveBeenCalledWith(
            EventTypes.GenericEvent,
            {
                eventAction: EventActions.LanguageSelection,
                eventCategory: EventCategories.NavigationBarMenu,
                eventLabel: 'FR-CH',
                eventType: EventTypes.Interaction,
            },
            GENERIC_CUSTOM_PARAMS_EMPTY,
        );
    });
});
