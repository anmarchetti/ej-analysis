import React from 'react';
import { render, screen } from '@testing-library/react';

import { mockSitecoreField, mockSitecoreImageField } from 'frontend/utils/tests.utils';

import AmendSummaryAccordion, { IAmendSummaryAccordionProps } from './AmendSummaryAccordion';

let mockProps: IAmendSummaryAccordionProps;

const mockExpandItemProps = jest.fn();
jest.mock('frontend/components/common/ExpandableItem/ExpandableItem', () => ({
    __esModule: true,
    default: ({ children, ...props }) => {
        mockExpandItemProps(props);

        return <div data-tid='expand-item'>{children}</div>;
    },
}));

describe('<AmendSummaryAccordion />', () => {
    beforeEach(() => {
        mockProps = {
            icon: mockSitecoreField(mockSitecoreImageField('image')),
            title: 'title',
            dataTid: 'data-tid',
            className: 'className',
            expanderClassName: 'expanderClassName',
            children: <div data-tid='children' />,
        };
    });

    it('Should render component', () => {
        render(<AmendSummaryAccordion {...mockProps} />);

        expect(screen.getByTestId('children')).toBeInTheDocument();
        expect(screen.getByTestId('expand-item')).toBeInTheDocument();
        expect(mockExpandItemProps).toHaveBeenCalledWith(
            expect.objectContaining({
                title: mockProps.title,
                isOpened: true,
                className: 'expander expanderClassName',
                titleClassName: 'title',
                iconClassName: 'icon',
                isShadowy: true,
            }),
        );
    });

    it('Should render with IExpandableItem rest props', () => {
        render(<AmendSummaryAccordion {...mockProps} isDisabled expandArrowClassName='expandArrowClassName' />);

        expect(mockExpandItemProps).toHaveBeenCalledWith(
            expect.objectContaining({
                isDisabled: true,
                expandArrowClassName: 'expandArrowClassName',
            }),
        );
    });

    it('Should render nothing when children have not been passed', () => {
        mockProps.children = undefined;
        const { container } = render(<AmendSummaryAccordion {...mockProps} />);

        expect(container.firstChild).toBeNull();
    });
});
