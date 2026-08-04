import { render, screen } from '@testing-library/react';

import { mockSitecoreField } from 'frontend/utils/tests.utils';

import Accordion from './Accordion';

const mockedAccordionComponent = jest.fn();
jest.mock('frontend/components/common/Accordion/Accordion', () => ({
    __esModule: true,
    default: ({ children, ...props }) => {
        mockedAccordionComponent(props);

        return <div data-tid='accordion-component'>{children}</div>;
    },
}));

jest.mock('frontend/components/common/Accordion/AccordionPanel', () => ({
    __esModule: true,
    default: () => <div data-tid='accordion-panel' />,
}));

const resetMocks = () => ({
    fields: {
        items: [
            {
                fields: {
                    Title: mockSitecoreField('test-1'),
                    Text: mockSitecoreField('test-1'),
                    isOpened: mockSitecoreField(false),
                },
                id: 'test-1',
            },
            {
                fields: {
                    Title: mockSitecoreField('test-2'),
                    Text: mockSitecoreField('test-2'),
                    isOpened: mockSitecoreField(false),
                },
                id: 'test-2',
            },
        ],
    },
    params: { isMultiple: '0' },
    rendering: null,
});

let mocks;

describe('SitecoreAccordion', () => {
    beforeEach(() => {
        mocks = resetMocks();
    });

    it('should be empty render if fields is null', () => {
        mocks.fields = null;
        const { container } = render(<Accordion {...mocks} />);

        expect(container).toBeEmptyDOMElement();
    });

    it('should render accordion (not multiple) with closed panels on default', () => {
        mocks.params = null;
        render(<Accordion {...mocks} />);

        expect(screen.getAllByTestId('accordion-panel').length).toEqual(mocks.fields.items.length);
        expect(mockedAccordionComponent).toHaveBeenCalledWith({
            isMultiple: false,
            defaultOpenedPanelsIds: [],
        });
    });

    it('should render multiple accordion', () => {
        mocks.params.isMultiple = '1';
        render(<Accordion {...mocks} />);

        expect(mockedAccordionComponent).toHaveBeenCalledWith({
            isMultiple: true,
            defaultOpenedPanelsIds: [],
        });
    });

    it('should render accordion with opened panel', () => {
        mocks.fields.items[0].fields.isOpened.value = true;
        render(<Accordion {...mocks} />);

        expect(mockedAccordionComponent).toHaveBeenCalledWith({
            isMultiple: false,
            defaultOpenedPanelsIds: [mocks.fields.items[0].id],
        });
        expect(screen.getAllByTestId('accordion-panel').length).toEqual(mocks.fields.items.length);
    });
});
