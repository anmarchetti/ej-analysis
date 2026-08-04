import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';

import SearchParameter, {
    ISearchParameterProps,
} from 'frontend/components/renderings/SearchPod/components/SearchParametersPreview/components/SearchParameter/SearchParameter';

const mockButtonComponent = jest.fn();
jest.mock('frontend/components/common/Button', () => props => {
    mockButtonComponent(props);

    return (
        <button data-tid={props.dataTid} onClick={props.onClick}>
            {props.children}
        </button>
    );
});

const resetMocks = (): ISearchParameterProps => ({
    icon: <div data-tid='icon'>icon</div>,
    title: 'title',
    value: 'value',
    onClick: jest.fn(),
    boldOnMobile: false,
    valueDataTid: 'value-tid',
});

let mockProps;

describe('<SearchParameter />', () => {
    beforeEach(() => {
        mockProps = resetMocks();
    });

    it('should render component', () => {
        render(<SearchParameter {...mockProps} />);

        expect(screen.getByText(mockProps.title)).toBeInTheDocument();
        expect(screen.getByTestId(mockProps.valueDataTid)).toHaveTextContent(mockProps.value);
        expect(mockButtonComponent).toHaveBeenCalledWith(
            expect.objectContaining({
                removeDefaultClass: true,
                className: 'button',
                onClick: mockProps.onClick,
                dataTid: 'search-parameter',
            }),
        );
        expect(screen.getByTestId('icon')).toBeInTheDocument();
    });

    it('should call onClick when item is clicked', () => {
        render(<SearchParameter {...mockProps} />);

        fireEvent.click(screen.getByTestId('search-parameter'));
        expect(mockProps.onClick).toHaveBeenCalled();
    });

    it('should have bold class when boldOnMobile', () => {
        mockProps.boldOnMobile = true;
        render(<SearchParameter {...mockProps} />);

        expect(screen.getByTestId(mockProps.valueDataTid)).toHaveClass('bold');
    });
});
