import React from 'react';
import { render, screen } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';

import { CurrencyCode } from 'code/currency';
import { createMockStores, mockPromoCodeBreakdown } from 'frontend/__mocks__';
import { getSitecoreFieldsBunch, mockSitecoreField } from 'frontend/utils/tests.utils';
import { IPromoCodeFields } from 'frontend/components/renderings/AmendPayment/interfaces';

import AmendPaymentPromoCodeDetails, { IAmendPaymentPromoCodeProps } from './PromoCodeDetails';
import {
    getPromocodeHeading,
    getPromocodeTitleFieldByStatus,
    getShouldShowPromocode,
    getTransferPromocodeSubtextByStatus,
} from './PromoCodeDetails.utils';

expect.extend(toHaveNoViolations);

export const mockPromoCodeFields = getSitecoreFieldsBunch<IPromoCodeFields>([
    'PromoCodeChangedTitle',
    'PromoCodeDowngradeHeading',
    'PromoCodeDowngradedSubtext',
    'PromoCodeErrorSubtext',
    'PromoCodeErrorTitle',
    { PromoCodeIcon: 'image' },
    'PromoCodeRemovedDefaultError',
    'PromoCodeRemovedHeading',
    'PromoCodeRemovedTitle',
    'PromoCodeUpdatedHeading',
    'PromoCodeUpdatedSubtext',
]);

let mockProps: IAmendPaymentPromoCodeProps;
let mockStores;

jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useContext: () => mockStores,
}));

const mockExpandableItemProps = jest.fn();
jest.mock('frontend/components/common/ExpandableItem/ExpandableItem', () => ({
    __esModule: true,
    default: ({ icon, children, ...props }) => {
        mockExpandableItemProps(props);

        return (
            <div data-tid='expandable-item'>
                {icon}
                {children}
            </div>
        );
    },
}));

const mockImageProps = jest.fn();
jest.mock('frontend/components/common/ImageWithFilter/ImageWithFilter', () => ({
    __esModule: true,
    default: props => {
        mockImageProps(props);

        return <div data-tid={props.dataTid} />;
    },
    SVGFilterMatrix: {
        Orange: 'orange',
    },
}));

jest.mock('./PromoCodeDetails.utils');

describe('<PromoCodeDetails />', () => {
    beforeAll(() => {
        jest.mocked(getPromocodeHeading).mockReturnValue(mockSitecoreField('PromoCode title'));
        jest.mocked(getPromocodeTitleFieldByStatus).mockReturnValue(mockSitecoreField('PromoCode description'));
        jest.mocked(getShouldShowPromocode).mockReturnValue(true);
        jest.mocked(getTransferPromocodeSubtextByStatus).mockReturnValue([
            { code: 'Error code', message: 'Error message' },
        ]);
    });

    beforeEach(() => {
        mockStores = createMockStores();
        mockProps = {
            fields: mockPromoCodeFields,
            promoCodeBreakDown: mockPromoCodeBreakdown,
            currency: CurrencyCode.GBP,
        };
    });

    it('Should render component', () => {
        render(<AmendPaymentPromoCodeDetails {...mockProps} />);

        expect(screen.getByTestId('amend-promo-code')).toBeInTheDocument();
        expect(screen.getByTestId('amend-promo-code-status')).toHaveTextContent('PromoCode description');
        expect(screen.getByTestId('amend-promo-code-description')).toHaveTextContent('Error message');
        expect(screen.getByTestId('amend-promo-code-icon')).toBeInTheDocument();
        expect(mockImageProps).toHaveBeenCalledWith(
            expect.objectContaining({
                imageSrc: 'PromoCodeIcon',
                filterMatrix: 'orange',
                dataTid: 'amend-promo-code-icon',
                className: 'titleIcon',
            }),
        );
        expect(mockExpandableItemProps).toHaveBeenCalledWith(
            expect.objectContaining({
                title: 'PromoCode title',
                className: 'expander',
                isOpened: true,
                dataTid: 'amend-promo-code-item',
            }),
        );
    });

    it('Should render nothing when getShouldShowPromocode returns false', () => {
        jest.mocked(getShouldShowPromocode).mockReturnValueOnce(false);

        const { container } = render(<AmendPaymentPromoCodeDetails {...mockProps} />);

        expect(container).toBeEmptyDOMElement();
    });

    describe('Accessibility', () => {
        it('should pass accessibility', async () => {
            const { container } = render(<AmendPaymentPromoCodeDetails {...mockProps} />);
            const results = await axe(container);

            expect(results).toHaveNoViolations();
        });
    });
});
