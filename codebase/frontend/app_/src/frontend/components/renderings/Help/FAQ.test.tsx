import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { createMockStores } from 'frontend/__mocks__';
import SitecoreDictionary from 'models/enum/SitecoreDictionary';

import { mockFAQItems, mockFaqTabItems } from './__mocks__/mockFAQItems';
import { mockFAQRatingFields } from './__mocks__/mockFAQRatingFields';
import FAQ, { FAQ_ID, TFAQProps } from './FAQ';

const createProps = (): TFAQProps => ({
    fields: {
        Categories: mockFAQItems,
        ...mockFAQRatingFields,
    },
    params: {},
    rendering: {},
});

const createStores = () =>
    createMockStores({
        queryParamStore: { helpCategory: 'category', helpQuestion: 'question' },
        routerStore: { redirectToQuestion: jest.fn() },
        trackingStore: { trackHelpCentreClick: jest.fn() },
    });

let mockProps = createProps();
let mockStores = createStores();

jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useContext: () => mockStores,
}));

jest.mock('frontend/components/common/TabAccordion/utils/tabAccordion.utils', () => ({
    getFaqTabItems: () => mockFaqTabItems,
}));

const mockTabAccordionProps = jest.fn();
jest.mock('frontend/components/common/TabAccordion/TabAccordion', () => ({
    __esModule: true,
    default: props => {
        mockTabAccordionProps(props);

        return (
            <div data-tid='tab-accordion'>
                {props.items.map(item => (
                    <button
                        data-tid={`tab-button-${item.id}`}
                        key={item.id}
                        onClick={() => {
                            props.onTabClick(item);
                        }}
                    />
                ))}
                {props.renderContent(props.items[0])}
            </div>
        );
    },
}));

const mockQuestionsAnswersProps = jest.fn();
jest.mock('frontend/components/renderings/Help/components/QuestionsAnswers/QuestionsAnswers', () => ({
    __esModule: true,
    default: props => {
        mockQuestionsAnswersProps(props);

        return <div data-tid='questions-answer' />;
    },
}));

const mockDrawerProps = jest.fn();
jest.mock('frontend/components/common/Drawer', () => ({
    __esModule: true,
    default: ({ children, ...props }) => {
        mockDrawerProps(props);

        if (props.open) {
            return <div data-tid='drawer'>{children}</div>;
        }

        return null;
    },
}));

const mockButtonProps = jest.fn();
jest.mock('frontend/components/common/Button', () => ({
    __esModule: true,
    default: props => {
        mockButtonProps(props);

        return <div data-tid='button' onClick={props.onClick} />;
    },
}));

let mockIsMoreThenTabletScreen = true;
jest.mock('frontend/hooks/useMediaQuery', () => ({
    __esModule: true,
    useMoreThenTabletViewport: () => mockIsMoreThenTabletScreen,
}));

jest.mock('frontend/components/renderings/Help/components/MobileBackButton', () => ({
    __esModule: true,
    default: () => <div data-tid='mobile-back-button' />,
}));

describe('<FAQ />', () => {
    beforeEach(() => {
        mockProps = createProps();
        mockStores = createStores();
    });

    it('should NOT render component if Categories content is NOT provided', () => {
        delete mockProps.fields;
        const { container } = render(<FAQ {...mockProps} />);

        expect(container).toBeEmptyDOMElement();
    });

    it('should render standard with selected first category by default', () => {
        render(<FAQ {...mockProps} />);

        expect(screen.getByTestId('tab-accordion')).toBeInTheDocument();
        expect(mockTabAccordionProps).toHaveBeenCalledWith({
            renderContent: expect.any(Function),
            items: mockFaqTabItems,
            onTabClick: expect.any(Function),
            tabAccordionClassName: 'container',
            id: FAQ_ID,
            scrollIntoView: true,
            tabCollapseBtnClassName: 'tabCollapseBtn',
        });

        expect(screen.getByTestId('questions-answer')).toBeInTheDocument();
        expect(mockQuestionsAnswersProps).toHaveBeenCalledWith({
            category: mockProps.fields?.Categories[0],
            faqRatingFields: mockProps.fields,
        });

        expect(screen.getByTestId('mobile-back-button')).toBeInTheDocument();
    });

    it('should render drawer as a content on mobile with helpCategory', async () => {
        mockIsMoreThenTabletScreen = false;
        mockStores = createMockStores({
            queryParamStore: { helpCategory: 'category', helpQuestion: undefined },
            routerStore: { redirectToQuestion: jest.fn() },
            trackingStore: { trackHelpCentreClick: jest.fn() },
        });
        render(<FAQ {...mockProps} />);

        expect(screen.getByTestId('tab-accordion')).toBeInTheDocument();

        expect(screen.getByTestId('drawer')).toBeInTheDocument();
        expect(mockDrawerProps).toHaveBeenCalledWith({
            open: true,
            className: 'drawer',
            dataTid: 'faq-drawer',
        });
        expect(screen.getByTestId('questions-answer')).toBeInTheDocument();
    });

    it('should NOT open drawer on mobile when no helpCategory or helpQuestion in URL', async () => {
        mockIsMoreThenTabletScreen = false;
        mockStores = createMockStores({
            queryParamStore: { helpCategory: undefined, helpQuestion: undefined },
            routerStore: { redirectToQuestion: jest.fn() },
            trackingStore: { trackHelpCentreClick: jest.fn() },
        });
        render(<FAQ {...mockProps} />);

        expect(screen.getByTestId('tab-accordion')).toBeInTheDocument();

        expect(mockDrawerProps).toHaveBeenCalledWith({
            open: false,
            className: 'drawer',
            dataTid: 'faq-drawer',
        });
        expect(screen.queryByTestId('drawer')).not.toBeInTheDocument();
    });

    it('should render drawer as a content on mobile with helpQuestion', async () => {
        mockIsMoreThenTabletScreen = false;
        render(<FAQ {...mockProps} />);

        expect(screen.getByTestId('tab-accordion')).toBeInTheDocument();

        expect(screen.getByTestId('drawer')).toBeInTheDocument();
        expect(mockDrawerProps).toHaveBeenCalledWith({
            open: true,
            className: 'drawer',
            dataTid: 'faq-drawer',
        });
        expect(screen.getByTestId('questions-answer')).toBeInTheDocument();
        expect(mockQuestionsAnswersProps).toHaveBeenCalledWith({
            category: mockProps.fields?.Categories[0],
            faqRatingFields: mockProps.fields,
        });
        expect(screen.getByTestId('button')).toBeInTheDocument();
        expect(mockButtonProps).toHaveBeenCalledWith({
            isTransparent: true,
            isFullWidth: true,
            onClick: expect.any(Function),
            dataTid: 'close-btn',
            children: SitecoreDictionary.GlobalsButtonsClose,
        });
    });

    it('should close drawer when user click close button on mobile', async () => {
        mockIsMoreThenTabletScreen = false;
        render(<FAQ {...mockProps} />);

        expect(screen.getByTestId('tab-accordion')).toBeInTheDocument();

        const secondCategoryButton = screen.getByTestId(`tab-button-${mockFaqTabItems[1].id}`);

        await userEvent.click(secondCategoryButton);

        expect(screen.getByTestId('drawer')).toBeInTheDocument();

        await userEvent.click(screen.getByTestId('button'));

        expect(screen.queryByTestId('drawer')).not.toBeInTheDocument();
    });
});
