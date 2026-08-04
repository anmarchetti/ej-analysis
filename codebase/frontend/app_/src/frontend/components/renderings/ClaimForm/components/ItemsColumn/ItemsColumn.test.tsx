import React from 'react';
import { render, screen } from '@testing-library/react';

import { mockSitecoreField } from 'frontend/utils/tests.utils';
import { eligibleItemsMock } from 'frontend/components/renderings/ClaimForm/__mocks__/claimFormFields.mock';

import ItemsColumn, { TItemsColumnProps } from './ItemsColumn';

const mockRichTextWithLinksProps = jest.fn();
jest.mock('frontend/components/common/RichTextWithLinks', () => ({
    __esModule: true,
    default: props => {
        mockRichTextWithLinksProps(props);

        return <div data-tid='rich-text-with-links' />;
    },
}));

const mockTextProps = jest.fn();
jest.mock('@sitecore-jss/sitecore-jss-nextjs', () => ({
    __esModule: true,
    Text: props => {
        mockTextProps(props);

        return <div data-tid='sitecore-jss-text' />;
    },
}));

const mockClaimFormItemProps = jest.fn();
jest.mock('frontend/components/renderings/ClaimForm/components/ClaimFormItem/ClaimFormItem', () => ({
    __esModule: true,
    default: props => {
        mockClaimFormItemProps(props);

        return <div data-tid='claim-form-item' />;
    },
}));

const createProps = (): TItemsColumnProps => ({
    description: mockSitecoreField('Column description'),
    items: eligibleItemsMock,
    title: mockSitecoreField('Column title'),
});

let mockProps = createProps();

describe('ClaimFormItem', () => {
    beforeEach(() => {
        mockProps = createProps();
    });

    it('should render component', () => {
        render(<ItemsColumn {...mockProps} />);

        expect(screen.getByTestId('not-eligible-items-column')).toBeInTheDocument();

        expect(screen.getByTestId('sitecore-jss-text')).toBeInTheDocument();
        expect(mockTextProps).toHaveBeenCalledWith({
            field: mockProps.title,
            tag: 'h4',
            className: 'title',
            'data-tid': 'items-column-title',
        });

        expect(screen.getByTestId('rich-text-with-links')).toBeInTheDocument();
        expect(mockRichTextWithLinksProps).toHaveBeenCalledWith({
            field: mockProps.description,
            className: 'description',
            dataId: 'items-column-description',
        });

        expect(screen.getAllByTestId('claim-form-item')).toHaveLength(mockProps.items.length);
        expect(mockClaimFormItemProps).toHaveBeenCalledTimes(mockProps.items.length);
        expect(mockClaimFormItemProps).toHaveBeenNthCalledWith(1, {
            ...mockProps.items[0].fields,
        });
    });

    it('should render eligible items column when isEligibleColumn is true', () => {
        render(<ItemsColumn {...mockProps} isEligibleColumn />);

        expect(screen.getByTestId('eligible-items-column')).toBeInTheDocument();
        expect(mockClaimFormItemProps).toHaveBeenCalledTimes(mockProps.items.length);
        expect(mockClaimFormItemProps).toHaveBeenNthCalledWith(1, {
            ...mockProps.items[0].fields,
            isEligibleItem: true,
        });
    });
});
