import React from 'react';
import { render, screen } from '@testing-library/react';

import { mockSitecoreField } from 'frontend/utils/tests.utils';

import SectionWrapper, { TSectionWrapperProps } from './SectionWrapper';

const createProps = (): TSectionWrapperProps => ({
    primaryBtnAction: jest.fn(),
    primaryBtnText: mockSitecoreField('Primary Button'),
    primaryBtnScreenReaderText: mockSitecoreField('Primary Button Screen Reader Text'),
    secondaryBtnAction: jest.fn(),
    secondaryBtnText: mockSitecoreField('Secondary Button'),
    secondaryBtnScreenReaderText: mockSitecoreField('Secondary Button Screen Reader Text'),
    children: <div data-tid='child' />,
});

let mockProps = createProps();

const mockButtonProps = jest.fn();
jest.mock('frontend/components/common/Button', () => ({
    __esModule: true,
    default: props => {
        mockButtonProps(props);

        return <button data-tid={props['data-tid']} />;
    },
}));

describe('<SectionWrapper />', () => {
    beforeEach(() => {
        mockProps = createProps();
    });

    it('should render component', () => {
        render(<SectionWrapper {...mockProps} />);

        expect(screen.getByTestId('section-wrapper')).toBeInTheDocument();

        expect(screen.getAllByRole('button')).toHaveLength(2);
        expect(mockButtonProps).toHaveBeenCalledWith({
            onClick: mockProps.secondaryBtnAction,
            isText: true,
            className: 'btn',
            'aria-label': mockProps.secondaryBtnScreenReaderText?.value,
            children: mockProps.secondaryBtnText?.value,
            'data-tid': 'secondary-button',
        });

        expect(mockButtonProps).toHaveBeenCalledWith({
            onClick: mockProps.primaryBtnAction,
            isMedium: true,
            className: 'btn',
            'aria-label': mockProps.primaryBtnScreenReaderText?.value,
            children: mockProps.primaryBtnText?.value,
            'data-tid': 'primary-button',
        });
    });

    it('should NOT render buttons if labels are NOT provided', () => {
        render(<SectionWrapper {...mockProps} primaryBtnText={undefined} secondaryBtnText={undefined} />);

        expect(screen.getByTestId('section-wrapper')).toBeInTheDocument();
        expect(screen.queryByRole('button')).not.toBeInTheDocument();
    });
});
