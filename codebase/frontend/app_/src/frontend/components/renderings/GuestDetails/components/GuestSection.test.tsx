import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { createMockStores, mockGuestPageFields } from 'frontend/__mocks__';
import { LoginCustomer } from 'models/data/LoginCustomer';
import { GuestType } from 'models/enum/GuestType';
import SitecoreDictionary from 'models/enum/SitecoreDictionary';
import SiteSettings from 'models/enum/SiteSettings';
import { ValidationType } from 'models/enum/ValidationType';

import { GuestSection } from './GuestSection';

const mockGuestDetailsBlock = jest.fn();
jest.mock('./section/GuestDetailsBlock', () => ({
    __esModule: true,
    default: ({ children, ...props }) => {
        mockGuestDetailsBlock(props);

        return (
            <div className={props.wrapperClassName} data-tid='guest-details-block'>
                {children}
            </div>
        );
    },
}));

const mockValidatableDateField = jest.fn();
jest.mock('frontend/components/common/ValidatableDateField', () => ({
    __esModule: true,
    default: props => {
        mockValidatableDateField(props);

        const { id, onChange } = props;

        return (
            <div data-tid={id}>
                <input data-tid={`${id}-input`} onChange={e => onChange(e.target.value)} />
            </div>
        );
    },
}));

const mockValidatableField = jest.fn();
jest.mock('frontend/components/common/ValidatableField/ValidatableFieldNew', () => ({
    __esModule: true,
    default: props => {
        mockValidatableField(props);

        const { id, onChange, children } = props;

        return (
            <div data-tid={id}>
                <input data-tid={`${id}-input`} onChange={e => onChange(e.target.value)} />
                {children}
            </div>
        );
    },
}));

const mockValidatableSelectField = jest.fn();
jest.mock('frontend/components/common/ValidatableSelectField', () => ({
    __esModule: true,
    default: ({ id, onChange, ...props }: any) => {
        mockValidatableSelectField({ id, onChange, ...props });

        return <div data-tid='vs' data-id={id} />;
    },
}));

const createStores = () =>
    createMockStores({
        guestDetailsStore: {
            setIsAddressLookup: jest.fn(),
            isAddressLookup: false,
        },
        trackingStore: { trackValidation: jest.fn() },
        appCatalogStore: {
            countries: {
                data: [{ value: 'GB', iso2: 'GB' }],
            },
        },
    });

jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useContext: () => createStores(),
}));

jest.mock('frontend/services/validation.service', () => ({
    __esModule: true,
    default: {
        validateEmail: jest.fn().mockReturnValue([]),
        validateField: jest.fn().mockReturnValue([]),
    },
}));

const mockTooltipContentComponent = jest.fn();
jest.mock('frontend/components/common/Tooltip', () => ({
    __esModule: true,
    Tooltip: ({ children }: { children: React.ReactNode }) => <div data-tid='tooltip'>{children}</div>,
    TooltipTrigger: () => <div data-tid='tooltip-trigger' />,
    TooltipContent: ({ text }: { text: string }) => {
        mockTooltipContentComponent(text);

        return <div data-tid='tooltip-content'>{text}</div>;
    },
}));

describe('<GuestSection />', () => {
    const resetMocks = () => ({
        guestDetails: {
            type: GuestType.Adult,
            email: 'test@example.com',
            isLead: true,
            errors: new Map(),
            dateOfBirthErrors: jest.fn(() => []),
            onChangeField: jest.fn(),
            isLeadLegalAdult: jest.fn(),
            toggleSurnameSameAsLead: jest.fn(),
            getErrorsBySiteName: jest.fn(() => []),
        } as any,
        passengers: [{ toggleSurnameForEachPassenger: jest.fn() }] as any,
        id: 0,
        forceErrors: false,
        holydayStartDate: new Date('2019-09-17T12:00:00.000Z'),
        getPhrase: jest.fn(v => v),
        getSecondarySectionText: jest.fn(),
        getPrimarySectionText: jest.fn(d => d.type),
        updateValidateEmailPage: jest.fn(),
        customerLogin: new LoginCustomer(),
        shoutCreateAccount: false,
        getSetting: jest.fn(),
        countryCodesSelectOptions: [{ label: 'GB', value: 'GB', iso2: 'GB' }],
        dialingCodesSelectOptions: [{ label: 'UK', value: '44' }],
        getCustomerTitlesSelectOptions: jest.fn(() => [{ label: 'Mr', value: 'Mr' }]),
        isTradePortal: false,
        fields: mockGuestPageFields,
        leadSurname: '',
        isFormValid: false,
        isEditMode: false,
    });
    let mocks = resetMocks();

    beforeEach(() => {
        mocks = resetMocks();
    });

    describe('componentDidMount', () => {
        it('should set dialingCode and countryCode to default values when they are missing', () => {
            mocks.guestDetails.dialingCode = undefined;
            mocks.guestDetails.countryCode = undefined;
            mocks.getSetting.mockImplementation(setting => {
                if (setting === SiteSettings.DefaultDialingCode) return '44';

                if (setting === SiteSettings.DefaultCountryCode) return 'GB';

                return '44';
            });

            const comp = new GuestSection(mocks);

            comp.componentDidMount();

            expect(mocks.guestDetails.onChangeField).toHaveBeenCalledWith('dialingCode', '44');
            expect(mocks.guestDetails.onChangeField).toHaveBeenCalledWith('countryCode', 'GB');
        });

        it('should NOT update dialingCode if it is already set', () => {
            mocks.guestDetails.dialingCode = '1';
            mocks.getSetting.mockReturnValue('44');

            const comp = new GuestSection(mocks);

            comp.componentDidMount();

            expect(mocks.guestDetails.onChangeField).not.toHaveBeenCalledWith('dialingCode', '44');
        });

        it('should NOT update countryCode if it is already set', () => {
            mocks.guestDetails.countryCode = 'US';
            mocks.getSetting.mockReturnValue('GB');

            const comp = new GuestSection(mocks);

            comp.componentDidMount();

            expect(mocks.guestDetails.onChangeField).not.toHaveBeenCalledWith('countryCode', 'GB');
        });

        it('should set dialingCode and countryCode to empty strings when defaults are not provided', () => {
            mocks.guestDetails.dialingCode = undefined;
            mocks.guestDetails.countryCode = undefined;
            mocks.getSetting.mockReturnValue(undefined);

            const comp = new GuestSection(mocks);

            comp.componentDidMount();

            expect(mocks.guestDetails.onChangeField).toHaveBeenCalledWith('dialingCode', '');
            expect(mocks.guestDetails.onChangeField).toHaveBeenCalledWith('countryCode', '');
        });
    });

    describe('componentDidUpdate behavior', () => {
        it('should set dialingCode to default when it is missing', () => {
            mocks.guestDetails.dialingCode = undefined;
            mocks.getSetting.mockReturnValue('44');

            const comp = new GuestSection(mocks);

            comp.componentDidUpdate();

            expect(mocks.guestDetails.onChangeField).toHaveBeenCalledWith('dialingCode', '44');
        });

        it('should NOT update dialingCode when it is already set', () => {
            mocks.guestDetails.dialingCode = '1';

            const comp = new GuestSection(mocks);

            comp.componentDidUpdate();

            expect(mocks.guestDetails.onChangeField).not.toHaveBeenCalled();
        });

        it('should dialingCode to empty string when default is not provided', () => {
            mocks.guestDetails.dialingCode = undefined;
            mocks.getSetting.mockReturnValue(undefined);

            const comp = new GuestSection(mocks);

            comp.componentDidUpdate();

            expect(mocks.guestDetails.onChangeField).toHaveBeenCalledWith('dialingCode', '');
        });
    });

    describe('Use this surname for each passenger block', () => {
        beforeEach(() => {
            mocks.guestDetails.isLead = true;
            mocks.isTradePortal = true;
            mocks.guestDetails.lastName = 'Black';
            mocks.guestDetails.useSurnameAsLead = true;
        });

        it('should NOT render checkbox and button when isLead is false', () => {
            mocks.guestDetails.isLead = false;

            render(<GuestSection {...mocks} />);

            expect(screen.queryByTestId('the-same-surname-for-all-passengers-checkbox')).not.toBeInTheDocument();
            expect(screen.queryByTestId('guest-section-remove-all-button')).not.toBeInTheDocument();
        });

        it('should NOT render checkbox and button when isTradePortal is false', () => {
            mocks.isTradePortal = false;

            render(<GuestSection {...mocks} />);

            expect(screen.queryByTestId('the-same-surname-for-all-passengers-checkbox')).not.toBeInTheDocument();
            expect(screen.queryByTestId('guest-section-remove-all-button')).not.toBeInTheDocument();
        });

        it('should render checkbox and button when isTradePortal and isLead are true', () => {
            render(<GuestSection {...mocks} />);

            expect(screen.getByTestId('the-same-surname-for-all-passengers-checkbox')).toBeInTheDocument();
            expect(screen.getByTestId('guest-section-remove-all-button')).toBeInTheDocument();
        });

        it('should NOT render "remove all" label when LastName is empty', () => {
            mocks.guestDetails.lastName = '';

            render(<GuestSection {...mocks} />);

            expect(screen.getByTestId('the-same-surname-for-all-passengers-checkbox')).toBeInTheDocument();
            expect(screen.queryByTestId('guest-section-remove-all-button')).not.toBeInTheDocument();
        });

        it('should NOT render "remove all" label when useSurnameAsLead is false', () => {
            mocks.guestDetails.useSurnameAsLead = false;

            render(<GuestSection {...mocks} />);

            expect(screen.getByTestId('the-same-surname-for-all-passengers-checkbox')).toBeInTheDocument();
            expect(screen.queryByTestId('guest-section-remove-all-button')).not.toBeInTheDocument();
        });

        it('should call toggleSurnameForEachPassenger on guest-section-remove-all-button click', async () => {
            render(<GuestSection {...mocks} />);

            await userEvent.click(screen.getByTestId('guest-section-remove-all-button'));

            expect(mocks.passengers[0].toggleSurnameForEachPassenger).toHaveBeenCalled();
        });
    });

    const getCapturedPropsById = (mockFn: jest.Mock, id: string) =>
        mockFn.mock.calls.map(c => c[0]).find((p: any) => p.id === id);

    describe('FormSelectField only for Adult & Child', () => {
        it('should render FormSelectField if Adult passenger', () => {
            mocks.guestDetails.type = GuestType.Adult;

            render(<GuestSection {...mocks} />);

            expect(
                getCapturedPropsById(mockValidatableSelectField, `title-${mocks.guestDetails.type}-${mocks.id}`),
            ).toBeTruthy();
        });

        it('should render FormSelectField field if Child passenger', () => {
            mocks.guestDetails.type = GuestType.Child;

            render(<GuestSection {...mocks} />);

            expect(
                getCapturedPropsById(mockValidatableSelectField, `title-${mocks.guestDetails.type}-${mocks.id}`),
            ).toBeTruthy();
        });

        it('should not render FormSelectField field if Infant passenger', () => {
            mocks.guestDetails.type = GuestType.Infant;

            render(<GuestSection {...mocks} />);

            expect(
                getCapturedPropsById(mockValidatableSelectField, `title-${mocks.guestDetails.type}-${mocks.id}`),
            ).toBeFalsy();
        });
    });

    describe('FirstName for all passenger types', () => {
        it('should render FirstName if Adult passenger', () => {
            mocks.guestDetails.type = GuestType.Adult;

            render(<GuestSection {...mocks} />);

            expect(screen.getByTestId(`first-name-${mocks.guestDetails.type}-${mocks.id}`)).toBeInTheDocument();
        });

        it('should render FirstName field if Child passenger', () => {
            mocks.guestDetails.type = GuestType.Child;

            render(<GuestSection {...mocks} />);

            expect(screen.getByTestId(`first-name-${mocks.guestDetails.type}-${mocks.id}`)).toBeInTheDocument();
        });

        it('should render FirstName field if Infant passenger', () => {
            mocks.guestDetails.type = GuestType.Infant;

            render(<GuestSection {...mocks} />);

            expect(screen.getByTestId(`first-name-${mocks.guestDetails.type}-${mocks.id}`)).toBeInTheDocument();
        });
    });

    describe('Surname for all passenger types', () => {
        it('should render Surname if Adult passenger', () => {
            mocks.guestDetails.type = GuestType.Adult;

            render(<GuestSection {...mocks} />);

            expect(screen.getByTestId(`surname-${mocks.guestDetails.type}-${mocks.id}`)).toBeInTheDocument();
        });

        it('should render Surname field if Child passenger', () => {
            mocks.guestDetails.type = GuestType.Child;

            render(<GuestSection {...mocks} />);

            expect(screen.getByTestId(`surname-${mocks.guestDetails.type}-${mocks.id}`)).toBeInTheDocument();
        });

        it('should render Surname field if Infant passenger', () => {
            mocks.guestDetails.type = GuestType.Infant;

            render(<GuestSection {...mocks} />);

            expect(screen.getByTestId(`surname-${mocks.guestDetails.type}-${mocks.id}`)).toBeInTheDocument();
        });
    });

    describe('Checkbox for copying Lead surname', () => {
        it('should render checkbox for copying Lead Surname if not Lead passenger', () => {
            mocks.guestDetails.type = GuestType.Infant;
            mocks.guestDetails.isLead = false;

            const { container } = render(<GuestSection {...mocks} />);

            expect(container.querySelector('.form-group-offer')).toBeInTheDocument();
        });

        it('should render checkbox for copying Lead Surname if not Lead passenger', () => {
            mocks.guestDetails.type = GuestType.Infant;
            mocks.guestDetails.isLead = true;

            const { container } = render(<GuestSection {...mocks} />);

            expect(container.querySelector('.form-group-offer')).not.toBeInTheDocument();
        });

        it('should call toggleSurnameSameAsLead on change', () => {
            mocks.guestDetails.isLead = false;

            const { container } = render(<GuestSection {...mocks} />);

            const [checkbox] = container.querySelectorAll("input[type='checkbox']");

            fireEvent.click(checkbox);

            expect(mocks.guestDetails.toggleSurnameSameAsLead).toHaveBeenCalledWith(true, '');
        });
    });

    describe('Lead passenger', () => {
        it('should render email field if lead passenger', () => {
            mocks.guestDetails.isLead = true;

            render(<GuestSection {...mocks} />);

            expect(screen.getByTestId('guest-details-block')).toBeInTheDocument();
            expect(mockGuestDetailsBlock).toHaveBeenCalledWith({
                defaultStatus: undefined,
                icon: expect.any(Object),
                id: 'guest-details-ADULT-0',
                ignoreAnimation: undefined,
                secondaryText: undefined,
                title: 'ADULT 0',
                wrapperClassName: '',
                isLead: true,
            });
            expect(screen.getByTestId(`email-${mocks.guestDetails.type}-${mocks.id}`)).toBeInTheDocument();
        });

        it('should call validation on email to check if it is allowed and return empty array in validation field if email is NOT in not allowed list', () => {
            mocks.guestDetails.isLead = true;
            mocks.isTradePortal = true;
            mocks.guestDetails.email = 'goodEmail@gooddomain.com';

            render(<GuestSection {...mocks} />);

            const emailProps = getCapturedPropsById(
                mockValidatableField,
                `email-${mocks.guestDetails.type}-${mocks.id}`,
            );

            expect(emailProps.errors).toEqual([]);
        });

        it('should call validation on email to check if it is allowed and return error in validation field if email is in not allowed domain list', () => {
            mocks.guestDetails.isLead = true;
            mocks.isTradePortal = true;
            mocks.guestDetails.email = 'goodEmail@example.com';

            render(<GuestSection {...mocks} />);

            const emailProps = getCapturedPropsById(
                mockValidatableField,
                `email-${mocks.guestDetails.type}-${mocks.id}`,
            );

            expect(emailProps.errors[0].errorMessage).toBe(SitecoreDictionary.GuestDetailsErrorMessagesEmailNotAllowed);
        });

        it('should call validation on email to check if it is allowed and return error if email is in not allowed list', () => {
            mocks.guestDetails.isLead = true;
            mocks.isTradePortal = true;

            render(<GuestSection {...mocks} />);

            const emailProps = getCapturedPropsById(
                mockValidatableField,
                `email-${mocks.guestDetails.type}-${mocks.id}`,
            );

            expect(emailProps.errors[0].errorMessage).toBe(SitecoreDictionary.GuestDetailsErrorMessagesEmailNotAllowed);
        });

        it('should render address, address2, city for lead passenger', () => {
            mocks.guestDetails.isLead = true;

            render(<GuestSection {...mocks} />);

            expect(screen.getByTestId(`address-${mocks.guestDetails.type}-${mocks.id}`)).toBeInTheDocument();
            expect(screen.getByTestId(`address2-${mocks.guestDetails.type}-${mocks.id}`)).toBeInTheDocument();
            expect(screen.getByTestId(`city-${mocks.guestDetails.type}-${mocks.id}`)).toBeInTheDocument();
        });

        it('should render postCode field if lead passenger', () => {
            mocks.guestDetails.isLead = true;

            render(<GuestSection {...mocks} />);

            expect(screen.getByTestId('postCode-ADULT-0-input')).toBeInTheDocument();

            const postCodeProps = getCapturedPropsById(mockValidatableField, 'postCode-ADULT-0');

            expect(postCodeProps).toStrictEqual({
                errors: [],
                label: 'GuestDetails.Labels.Postcode',
                value: undefined,
                onChange: expect.any(Function),
                ariaLabel: 'ADULT 0 (GuestDetails.SectionHeaders.LeadGuest) GuestDetails.Labels.Postcode',
                id: 'postCode-ADULT-0',
                submitted: false,
                autoComplete: 'postal-code',
            });
        });

        it('should render phone field if lead passenger', () => {
            mocks.guestDetails.isLead = true;
            mocks.forceErrors = true;

            render(<GuestSection {...mocks} />);

            expect(screen.getByTestId('phone-ADULT-0-input')).toBeInTheDocument();
            expect(mockValidatableField).toHaveBeenNthCalledWith(4, {
                errors: [],
                type: 'tel',
                value: undefined,
                id: 'phone-ADULT-0',
                label: 'GuestDetails.Labels.Phone',
                onChange: expect.any(Function),
                blurTransform: expect.any(Function),
                placeholder: '',
                ariaLabel: 'ADULT 0 (GuestDetails.SectionHeaders.LeadGuest) GuestDetails.Labels.Phone',
                afterFieldRender: expect.any(Object),
                children: expect.any(Object),
                prefix: expect.any(Object),
                submitted: true,
                fieldClassName: 'phoneField active',
                inputMode: 'numeric',
                onFocus: expect.any(Function),
            });
        });

        it('should NOT render email field if not lead passenger', () => {
            mocks.guestDetails.isLead = false;

            render(<GuestSection {...mocks} />);

            expect(screen.queryByTestId(`email-${mocks.guestDetails.type}-${mocks.id}`)).not.toBeInTheDocument();
        });
    });

    describe('Child passenger', () => {
        it('should render date of child birth when child is presented', () => {
            mocks.guestDetails.type = GuestType.Child;
            mocks.guestDetails.isLead = false;
            mocks.guestDetails.id = 11;

            render(<GuestSection {...mocks} />);

            const el = screen.getByTestId(`dateOfBirth-${mocks.guestDetails.type}-${mocks.id}`);

            expect(el).toBeInTheDocument();
        });

        it('should NOT render date of child birth when child is NOT presented', () => {
            render(<GuestSection {...mocks} />);

            const el = screen.queryByTestId(`dateOfChildBirth-${mocks.guestDetails.type}-${mocks.id}`);

            expect(el).not.toBeInTheDocument();
        });

        it('should render the same surname as the lead passenger', () => {
            mocks.guestDetails.type = GuestType.Adult;
            mocks.guestDetails.useSurnameAsLead = true;
            mocks.guestDetails.isLead = false;

            const m = { ...mocks, leadSurname: 'leadSurname' };

            render(<GuestSection {...m} />);

            const surnameProps = getCapturedPropsById(mockValidatableField, `surname-${m.guestDetails.type}-${m.id}`);

            expect(surnameProps.value).toEqual('leadSurname');
        });
    });

    describe('onChangeDateOfBirth', () => {
        beforeEach(() => {
            jest.resetAllMocks();
        });

        it('should set dateOfBirth to default value when guest is lead', () => {
            mocks.guestDetails.isLead = true;

            const comp = new GuestSection(mocks);

            comp['onChangeDateOfBirth']('');

            expect(mocks.guestDetails.onChangeField).toHaveBeenCalledWith('dateOfBirth', '07/10/1989');
        });

        it('should format and set dateOfBirth when guest is a child', () => {
            mocks.guestDetails.isLead = false;
            mocks.guestDetails.type = GuestType.Child;

            const comp = new GuestSection(mocks);

            comp['onChangeDateOfBirth']('01/01/2020');

            expect(mocks.guestDetails.onChangeField).toHaveBeenCalledWith('dateOfBirth', '01/01/2020');
        });
    });

    describe('getLastNameValue', () => {
        it('should return leadSurname when useSurnameAsLead is true and not lead passenger', () => {
            mocks.guestDetails.isLead = false;
            mocks.guestDetails.useSurnameAsLead = true;
            mocks.leadSurname = 'Smith';

            const comp = new GuestSection(mocks);

            const result = comp['getLastNameValue']();

            expect(result).toBe('Smith');
        });

        it('should return lastName when useSurnameAsLead is false', () => {
            mocks.guestDetails.isLead = false;
            mocks.guestDetails.useSurnameAsLead = false;
            mocks.guestDetails.lastName = 'Doe';

            const comp = new GuestSection(mocks);

            const result = comp['getLastNameValue']();

            expect(result).toBe('Doe');
        });
    });

    describe('validateEmailAllowList', () => {
        it('should return error when email is in the not allowed list', () => {
            mocks.fields.BlacklistedEmails = { value: 'blocked@example.com' };
            mocks.fields.BlacklistedDomains = { value: 'baddomain.com' };

            const comp = new GuestSection(mocks);

            const result = comp['validateEmailAllowList']('blocked@example.com');

            expect(result).toEqual([
                {
                    errorMessage: SitecoreDictionary.GuestDetailsErrorMessagesEmailNotAllowed,
                    trigger: ValidationType.OnBlur,
                },
            ]);
        });

        it('should return empty array when email is allowed', () => {
            mocks.fields.BlacklistedEmails = { value: 'blocked@example.com' };
            mocks.fields.BlacklistedDomains = { value: 'baddomain.com' };

            const comp = new GuestSection(mocks);

            const result = comp['validateEmailAllowList']('allowed@example.com');

            expect(result).toEqual([]);
        });
    });

    describe('onClearSurnameInfo', () => {
        it('should clear lastName for all passengers', () => {
            mocks.passengers = [
                { toggleSurnameForEachPassenger: jest.fn(), lastName: 'Smith' },
                { toggleSurnameForEachPassenger: jest.fn(), lastName: 'Johnson' },
            ];

            const comp = new GuestSection(mocks);

            comp['onClearSurnameInfo']();

            mocks.passengers.forEach(passenger => {
                expect(passenger.toggleSurnameForEachPassenger).toHaveBeenCalledWith(false, '');
                expect(passenger.lastName).toBe('');
            });
        });
    });

    describe('will-be-invalid class', () => {
        it('should return an empty string when the form is valid', () => {
            mocks.isFormValid = true;

            const comp = new GuestSection(mocks);

            expect(comp.wrapperClassNames).toBe('');
        });

        it('should return "will-be-invalid" when there are base errors', () => {
            mocks.isFormValid = false;
            mocks.guestDetails.getErrorsBySiteName.mockReturnValue(['error1']);

            const comp = new GuestSection(mocks);

            expect(comp.wrapperClassNames).toBe('will-be-invalid');
        });

        it('should return "will-be-invalid" when there are password errors for lead guest', () => {
            mocks.isFormValid = false;
            mocks.isTradePortal = false;
            mocks.guestDetails.isLead = true;

            mocks.customerLogin = {
                isEmailValidated: true,
                isEmailExists: false,
                passwordErrors: [{}],
            } as unknown as LoginCustomer;

            const comp = new GuestSection(mocks);

            expect(comp.wrapperClassNames).toBe('will-be-invalid');
        });

        it('should return an empty string when there are no errors and the form is invalid', () => {
            mocks.isFormValid = false;
            mocks.guestDetails.getErrorsBySiteName.mockReturnValue([]);

            mocks.customerLogin = {
                isEmailValidated: true,
                isEmailExists: true,
                passwordErrors: [],
            } as unknown as LoginCustomer;

            const comp = new GuestSection(mocks);

            expect(comp.wrapperClassNames).toBe('');
        });
    });
});
