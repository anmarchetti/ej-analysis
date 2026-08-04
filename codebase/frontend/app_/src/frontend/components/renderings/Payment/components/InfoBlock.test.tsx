import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { createMockStores } from 'frontend/__mocks__';
import { mockSitecoreField } from 'frontend/utils/tests.utils';

import { IInfoBlockProps, InfoBlock } from './InfoBlock';

const propsFields = {
    ImportantInformationConfirmationWithAirportParking: mockSitecoreField('Airport Parking Info'),
    ImportantInformation: mockSitecoreField('Important Information'),
    ImportantInformationConfirmation: mockSitecoreField('Important Confirmation'),
};

const createProps = (): IInfoBlockProps => ({
    fields: propsFields,
    togglePolicy: jest.fn(),
    isConfirmPolicyValid: true,
    isConfirmPolicyChecked: false,
    params: {},
    rendering: {},
});

let props: IInfoBlockProps;

const createStores = (isExternalExtrasEnabled = false, selectedAirportParking: string | null = null) =>
    createMockStores({
        layoutStore: {
            isExternalExtrasEnabled,
        },
        airportParkingStore: {
            selectedAirportParking,
        },
    });

let mockStores = createStores();

jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useContext: () => mockStores,
}));

let mockIsHolidayStore = true;
jest.mock('frontend/store/holidays', () => ({
    isHolidayStore: jest.fn(() => mockIsHolidayStore),
}));

const mockInfoBlock = jest.fn();
jest.mock('frontend/components/common/ConfirmationInfo/ConfirmationInfo', () => ({
    __esModule: true,
    default: ({ onClick, ...restProps }) => {
        mockInfoBlock(restProps);

        return <input type='checkbox' data-tid='confirmation-info' onChange={onClick} />;
    },
}));

describe('<InfoBlock />', () => {
    beforeEach(() => {
        props = createProps();
        mockStores = createStores();
    });

    it('should render the component', () => {
        render(<InfoBlock {...props} />);
        expect(screen.getByTestId('confirmation-info')).toBeInTheDocument();
        expect(mockInfoBlock).toHaveBeenCalledWith({
            checkboxLabel: propsFields.ImportantInformationConfirmation,
            children: undefined,
            disabled: undefined,
            hideInfoHead: undefined,
            importantInformation: propsFields.ImportantInformation,
            isConfirmPolicyChecked: false,
            isConfirmPolicyValid: true,
        });
    });

    it('should call togglePolicy on click', async () => {
        render(<InfoBlock {...props} />);
        await userEvent.click(screen.getByTestId('confirmation-info'));
        expect(props.togglePolicy).toHaveBeenCalled();
    });

    it('should not render the checkbox label when fields are missing', () => {
        props.fields = undefined;
        render(<InfoBlock {...props} />);
        expect(screen.getByTestId('confirmation-info')).toBeInTheDocument();
        expect(screen.queryByText(propsFields.ImportantInformationConfirmation.value)).not.toBeInTheDocument();
    });

    describe('external extra fields', () => {
        beforeEach(() => {
            mockStores = createStores(true, 'ABC');
        });

        it('should render the checkbox label with airportparking when external extras are enabled', () => {
            render(<InfoBlock {...props} />);

            expect(screen.getByTestId('confirmation-info')).toBeInTheDocument();
            expect(mockInfoBlock).toHaveBeenCalledWith({
                checkboxLabel: propsFields.ImportantInformationConfirmationWithAirportParking,
                children: undefined,
                disabled: undefined,
                hideInfoHead: undefined,
                importantInformation: propsFields.ImportantInformation,
                isConfirmPolicyChecked: false,
                isConfirmPolicyValid: true,
            });
        });
    });

    describe('Trade portal', () => {
        beforeEach(() => {
            mockStores = createStores(true, 'ABC');
            delete mockStores.airportParkingStore;
            mockIsHolidayStore = false;
        });

        it('should NOT render airport parking related fields', () => {
            render(<InfoBlock {...props} />);

            expect(screen.getByTestId('confirmation-info')).toBeInTheDocument();
            expect(mockInfoBlock).toHaveBeenCalledWith({
                checkboxLabel: propsFields.ImportantInformationConfirmation,
                children: undefined,
                disabled: undefined,
                hideInfoHead: undefined,
                importantInformation: propsFields.ImportantInformation,
                isConfirmPolicyChecked: false,
                isConfirmPolicyValid: true,
            });
        });
    });
});
