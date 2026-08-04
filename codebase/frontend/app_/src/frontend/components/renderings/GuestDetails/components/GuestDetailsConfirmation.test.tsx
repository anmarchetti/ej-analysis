import React from 'react';
import { render, screen } from '@testing-library/react';

import { createMockStores } from 'frontend/__mocks__/createMockStores';
import { mockSitecoreField } from 'frontend/utils/tests.utils';
import SitecoreDictionary from 'models/enum/SitecoreDictionary';

import { GuestDetailsConfirmation } from './GuestDetailsConfirmation';

const createProps = () => ({
    fields: { ImportantInformation: mockSitecoreField('Important Information') },
});

let mockProps;
let mockStores;
const mockConfirmationInfoProps = jest.fn();
const mockErrataMessageProps = jest.fn();

jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useContext: () => mockStores,
}));

jest.mock('frontend/components/common/ConfirmationInfo/ConfirmationInfo', () => ({
    __esModule: true,
    default: ({ checkboxLabel, containerClassName, children, ...props }) => {
        mockConfirmationInfoProps(props);

        return (
            <div className={containerClassName} data-tid='confirmation-info'>
                {checkboxLabel}
                {children}
            </div>
        );
    },
}));

jest.mock('frontend/components/common/ErrataInfo/ErrataMessage', () => ({
    __esModule: true,
    default: props => {
        mockErrataMessageProps(props);

        return <div data-tid='errata-message' />;
    },
}));

describe('<GuestDetailsConfirmation />', () => {
    beforeEach(() => {
        mockProps = createProps();
        mockStores = createMockStores({
            layoutStore: { isErrataEnabled: true, isFacilityErrataEnabled: true },
            bookingStore: {
                selectedOffer: {
                    errataInfo: ['offer errata 1', 'offer errata 2'],
                    transport: { errataFlightInfo: ['flight errata 1', 'flight errata 2'] },
                    hotel: { errataFacilities: [{ name: 'facilities errata 1' }, { name: 'facilities errata 2' }] },
                },
            },
            guestDetailsStore: { confirmPolicy: true, shouldConfirmPolicy: true, toggleConfirmPolicy: jest.fn() },
        });
    });

    it('should render ConfirmationInfo, GuestDetailsCheckboxesConfirmationWithErrata and errata message', () => {
        render(<GuestDetailsConfirmation {...mockProps} />);

        expect(screen.getByTestId('confirmation-info')).toHaveClass('section-container');
        expect(screen.getByText(SitecoreDictionary.GuestDetailsCheckboxesConfirmationWithErrata)).toBeInTheDocument();
        expect(screen.getByTestId('errata-message')).toBeInTheDocument();
        expect(mockErrataMessageProps).toHaveBeenCalledWith({
            errataInfo: mockStores.bookingStore.selectedOffer.errataInfo,
            flightErratas: mockStores.bookingStore.selectedOffer.transport.errataFlightInfo,
            facilityErratas: ['facilities errata 1', 'facilities errata 2'],
        });

        expect(mockConfirmationInfoProps).toHaveBeenCalledWith({
            importantInformation: mockProps.fields.ImportantInformation,
            onClick: mockStores.guestDetailsStore.toggleConfirmPolicy,
            isConfirmPolicyChecked: mockStores.guestDetailsStore.confirmPolicy,
            isConfirmPolicyValid: false,
        });
    });

    it('should NOT render ErrataMessage and render GuestDetailsCheckboxesConfirmation when isErrataEnabled and isFacilityErrataEnabled are false', () => {
        mockStores.layoutStore.isErrataEnabled = false;
        mockStores.layoutStore.isFacilityErrataEnabled = false;
        render(<GuestDetailsConfirmation {...mockProps} />);

        expect(screen.getByText(SitecoreDictionary.GuestDetailsCheckboxesConfirmation)).toBeInTheDocument();
        expect(screen.queryByTestId('errata-message')).not.toBeInTheDocument();
        expect(mockErrataMessageProps).not.toHaveBeenCalled();
    });

    it('should NOT render ErrataMessage and render GuestDetailsCheckboxesConfirmation erratas are NOT provided', () => {
        mockStores.bookingStore.selectedOffer = {};
        render(<GuestDetailsConfirmation {...mockProps} />);

        expect(screen.getByText(SitecoreDictionary.GuestDetailsCheckboxesConfirmation)).toBeInTheDocument();
        expect(screen.queryByTestId('errata-message')).not.toBeInTheDocument();
        expect(mockErrataMessageProps).not.toHaveBeenCalled();
    });
});
