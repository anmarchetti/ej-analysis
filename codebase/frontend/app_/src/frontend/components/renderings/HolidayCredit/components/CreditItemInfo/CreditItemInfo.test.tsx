import React from 'react';
import { render, screen } from '@testing-library/react';

import { createMockStores } from 'frontend/__mocks__';
import { mockSitecoreField, mockSitecoreImageField } from 'frontend/utils/tests.utils';

import CreditItemInfo, { TCreditItemInfoProps } from './CreditItemInfo';

const createProps = (overrides?: Partial<TCreditItemInfoProps>): TCreditItemInfoProps => ({
    creditTypeName: 'Holiday Credit',
    dataTid: 'credit-item',
    description: 'Test description',
    showLogo: true,
    isRecentCredit: false,
    logo: mockSitecoreField(mockSitecoreImageField('image')),
    ...overrides,
});

const createStores = () => createMockStores();

let mockProps = createProps();
let mockStores = createStores();

jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useContext: () => mockStores,
}));

const mockJSSImage = jest.fn();
jest.mock('frontend/components/common/JSSImage', () => ({
    __esModule: true,
    default: props => {
        mockJSSImage(props);

        return <img data-tid={props.dataTid} alt='logo' />;
    },
}));

describe('<CreditItemInfo />', () => {
    beforeEach(() => {
        mockProps = createProps();
        mockStores = createStores();
    });

    it('should render credit type name correctly', () => {
        render(<CreditItemInfo {...mockProps} />);

        expect(screen.getByTestId('credit-item-credit-type')).toBeInTheDocument();
        expect(screen.getByText('Holiday Credit')).toBeInTheDocument();
    });

    it('should render description when provided', () => {
        render(<CreditItemInfo {...mockProps} />);

        expect(screen.getByTestId('credit-item-description')).toBeInTheDocument();
        expect(screen.getByText('Test description')).toBeInTheDocument();
    });

    it('should not render description when empty', () => {
        mockProps = createProps({ description: '' });

        render(<CreditItemInfo {...mockProps} />);

        expect(screen.queryByTestId('credit-item-description')).not.toBeInTheDocument();
    });

    it('should render logo when showLogo is true and logo is provided', () => {
        render(<CreditItemInfo {...mockProps} />);

        expect(screen.getByTestId('credit-item-icon')).toBeInTheDocument();
        expect(mockJSSImage).toHaveBeenCalledWith({
            className: expect.any(String),
            field: mockProps.logo,
            dataTid: 'credit-item-icon',
        });
    });

    it('should render no-icon div when showLogo is true but logo is not provided', () => {
        mockProps = createProps({ logo: { value: { src: '' } } as any });

        render(<CreditItemInfo {...mockProps} />);

        expect(screen.getByTestId('credit-item-no-icon')).toBeInTheDocument();
        expect(mockJSSImage).not.toHaveBeenCalled();
    });

    it('should not render logo when showLogo is false', () => {
        mockProps = createProps({ showLogo: false });

        render(<CreditItemInfo {...mockProps} />);

        expect(screen.queryByTestId('credit-item-icon')).not.toBeInTheDocument();
        expect(screen.queryByTestId('credit-item-no-icon')).not.toBeInTheDocument();
    });

    it('should apply recentCredit class when isRecentCredit is true', () => {
        mockProps = createProps({ isRecentCredit: true });

        const { container } = render(<CreditItemInfo {...mockProps} />);

        const infoContainer = container.querySelector('[data-tid="credit-item-credit-info-container"]');
        expect(infoContainer).toHaveClass('recentCredit');
    });

    it('should not apply recentCredit class when isRecentCredit is false', () => {
        mockProps = createProps({ isRecentCredit: false });

        const { container } = render(<CreditItemInfo {...mockProps} />);

        const infoContainer = container.querySelector('[data-tid="credit-item-credit-info-container"]');
        expect(infoContainer).not.toHaveClass('recentCredit');
    });

    it('should render with custom dataTid', () => {
        mockProps = createProps({ dataTid: 'custom-tid' });

        render(<CreditItemInfo {...mockProps} />);

        expect(screen.getByTestId('custom-tid-credit-info-container')).toBeInTheDocument();
        expect(screen.getByTestId('custom-tid-credit-type')).toBeInTheDocument();
    });
});
