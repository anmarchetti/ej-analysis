import React from 'react';
import { render, screen } from '@testing-library/react';

import { ENGLISH, ENGLISH_REGION } from 'code/cmsLang';
import { createMockStores } from 'frontend/__mocks__/createMockStores';
import * as usePrevious from 'frontend/hooks/usePrevious';
import { mockSitecoreField } from 'frontend/utils/tests.utils';
import * as chatbotScripts from 'frontend/components/renderings/Chatbot/components/createChatbotsScripts';

import Chatbot from './Chatbot';

const createProps = () => ({
    fields: {
        SCAnalyticsGlobalValue: 'analytics',
        Title: mockSitecoreField('title'),
    },
    params: {
        EnableLazyLoading: '1',
        IsSalesChatbot: '1',
    },
});

let mockProps;
let mockStores;

jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useContext: () => mockStores,
}));

jest.mock('next/head', () => () => <div data-tid='head' />);

const mockCreateHelpChatbotScript = jest.spyOn(chatbotScripts, 'createHelpChatbotScript').mockImplementation(jest.fn());
const mockCreateSalesChatbotScript = jest
    .spyOn(chatbotScripts, 'createSalesChatbotScript')
    .mockImplementation(jest.fn());

describe('<Chatbot />', () => {
    beforeEach(() => {
        mockProps = createProps();
        mockStores = createMockStores({
            layoutStore: {
                isEditMode: false,
                currentPath: 'path',
                isHotelDetailsBookPage: true,
                getSettingAsBoolean: jest.fn(() => true),
                lang: 'en',
            },
        });
    });

    it('should NOT render when isEditMode', () => {
        mockStores.layoutStore.isEditMode = true;
        const { container } = render(<Chatbot {...mockProps} />);

        expect(container).toBeEmptyDOMElement();
        expect(mockCreateSalesChatbotScript).not.toHaveBeenCalled();
        expect(mockCreateHelpChatbotScript).not.toHaveBeenCalled();
    });

    it('should NOT render when chatbot is disabled', () => {
        mockStores.layoutStore.getSettingAsBoolean = jest.fn(() => false);
        const { container } = render(<Chatbot {...mockProps} />);

        expect(container).toBeEmptyDOMElement();
        expect(mockCreateSalesChatbotScript).not.toHaveBeenCalled();
        expect(mockCreateHelpChatbotScript).not.toHaveBeenCalled();
    });

    it('should render sales chatbot when isSalesChatbot is true', () => {
        const { container } = render(<Chatbot {...mockProps} />);

        expect(container.getElementsByClassName('chatbot')[0]).toHaveClass('sales-chatbot');
        expect(screen.getByTestId('head')).toBeInTheDocument();
        expect(mockCreateSalesChatbotScript).toHaveBeenCalledWith(
            mockProps.fields.Title.value,
            mockProps.fields.SCAnalyticsGlobalValue,
            'en',
            mockStores.layoutStore.lang,
            'GB',
        );
        expect(mockCreateHelpChatbotScript).not.toHaveBeenCalled();
    });

    it('should render help chatbot when isSalesChatbot is false', () => {
        mockProps.params.IsSalesChatbot = undefined;
        const { container } = render(<Chatbot {...mockProps} />);

        expect(container.getElementsByClassName('chatbot')[0]).not.toHaveClass('sales-chatbot');
        expect(screen.getByTestId('head')).toBeInTheDocument();
        expect(mockCreateSalesChatbotScript).not.toHaveBeenCalled();
        expect(mockCreateHelpChatbotScript).toHaveBeenCalledWith(
            mockProps.fields.Title.value,
            mockProps.fields.SCAnalyticsGlobalValue,
            'en',
            mockStores.layoutStore.lang,
        );
    });

    it('should call createSalesChatbotScript twice when isChatbotEnabled, isHotelDetailsBookPage, isPrevHotelDetilsBookPage and prevPagePath is different than currentPath', () => {
        jest.spyOn(usePrevious, 'default').mockReturnValue('path-test');
        render(<Chatbot {...mockProps} />);

        expect(mockCreateSalesChatbotScript).toHaveBeenCalledTimes(2);
    });

    it('should call createSalesChatbotScript with default values', () => {
        mockProps.fields.Title = undefined;
        mockProps.fields.SCAnalyticsGlobalValue = undefined;
        mockStores.layoutStore.lang = undefined;
        render(<Chatbot {...mockProps} />);

        expect(mockCreateSalesChatbotScript).toHaveBeenLastCalledWith('', '', ENGLISH, ENGLISH, ENGLISH_REGION);
    });

    it('should call mockCreateHelpChatbotScript with default values', () => {
        mockProps.params.IsSalesChatbot = undefined;
        mockProps.fields.Title = undefined;
        mockProps.fields.SCAnalyticsGlobalValue = undefined;
        mockStores.layoutStore.lang = undefined;
        render(<Chatbot {...mockProps} />);

        expect(mockCreateHelpChatbotScript).toHaveBeenLastCalledWith('', '', ENGLISH, ENGLISH);
    });

    it('should provide region and lang to createSalesChatbotScript from store', () => {
        mockStores.layoutStore.lang = 'ch-fr';
        render(<Chatbot {...mockProps} />);

        expect(mockCreateSalesChatbotScript).toHaveBeenLastCalledWith(
            'title',
            'analytics',
            'fr',
            mockStores.layoutStore.lang,
            'CH',
        );
    });
});
