import { buildCreatePasswordValidationRules, ValidationConfig } from 'code/validation.config';
import validationService from 'frontend/services/validation.service';
import SitecoreDictionary from 'models/enum/SitecoreDictionary';

import { LoginCustomer } from './LoginCustomer';

jest.mock('code/validation.config', () => {
    const original = jest.requireActual('code/validation.config');

    return {
        ...original,
        buildCreatePasswordValidationRules: jest.fn(() => original.ValidationConfig.createPassword),
    };
});

describe('LoginCustomer', () => {
    let loginCustomerModel;

    beforeEach(() => {
        loginCustomerModel = new LoginCustomer();
    });

    describe('Data', () => {
        beforeEach(() => {
            loginCustomerModel.email = 'email@test.com';
            loginCustomerModel.password = 'password';
            loginCustomerModel.errors = [];
            loginCustomerModel.isEmailExists = false;
            loginCustomerModel.isEmailValidated = false;
            loginCustomerModel.isEmailDisabled = false;
            loginCustomerModel.isNewCustomer = false;
            loginCustomerModel.alreadyLoggedEmail = 'email@test.com';
            loginCustomerModel.rerenderKey = 5;
        });

        it('should reset fields on log(in/out) except alreadyLoggedEmail and key', () => {
            loginCustomerModel.cleanUpModel();

            expect(loginCustomerModel.email).toBe('');
            expect(loginCustomerModel.password).toBe('');
            expect(loginCustomerModel.errors).toHaveLength(0);
            expect(loginCustomerModel.isEmailExists).toBeFalsy();
            expect(loginCustomerModel.isEmailValidated).toBeFalsy();
            expect(loginCustomerModel.isEmailDisabled).toBeFalsy();
            expect(loginCustomerModel.isNewCustomer).toBeFalsy();
            expect(loginCustomerModel.alreadyLoggedEmail).toEqual('email@test.com');
            expect(loginCustomerModel.rerenderKey).toEqual(5);
        });
    });

    describe('email errors', () => {
        it("shouldn't have errors if validation service doesn't return errors and current user is not the same with log in", () => {
            loginCustomerModel.alreadyLoggedEmail = 'prev_email@test.com';
            validationService.validateField = jest.fn().mockReturnValueOnce([]);
            const errors = loginCustomerModel.emailErrors;

            expect(errors).toEqual([]);
        });

        it('should have errors if validation service returns errors', () => {
            loginCustomerModel.alreadyLoggedEmail = 'prev_email@test.com';
            validationService.validateField = jest.fn().mockReturnValueOnce(['error']);
            const errors = loginCustomerModel.emailErrors;

            expect(errors).toEqual(['error']);
        });

        it('should set errors with EmailAlreadyLoggedWith error', () => {
            const email = 'email@test.com';
            loginCustomerModel.email = email;
            loginCustomerModel.alreadyLoggedEmail = email;
            validationService.validateField = jest.fn().mockReturnValueOnce([]);
            const errors = loginCustomerModel.emailErrors;

            expect(errors).toEqual([
                {
                    errorMessage: SitecoreDictionary.GuestDetailsErrorMessagesEmailAlreadyLoggedWith,
                    trigger: 'OnBlur',
                },
            ]);
        });

        it('should not return first error if there are no errors at all', () => {
            const firstError = loginCustomerModel.firstError;

            expect(firstError).toBeFalsy();
        });

        it('should return first error if there are fatal errors', () => {
            loginCustomerModel.errors = [{ title: 'title', description: 'description', isFatal: true }];
            const firstError = loginCustomerModel.firstError;

            expect(firstError).toBeTruthy();
        });
    });

    describe('fields change', () => {
        describe('onChangePassword()', () => {
            it(`should set new password value`, () => {
                const newPasswordValue = 'newPassword';
                loginCustomerModel.onChangePassword(newPasswordValue);

                expect(loginCustomerModel['password']).toEqual(newPasswordValue);
            });
        });

        describe('onChangeLoggedEmail()', () => {
            it('should set new value if logged user was changed', () => {
                const newEmailValue = 'test@gmail.com';
                loginCustomerModel.onChangeLoggedEmail(newEmailValue);

                expect(loginCustomerModel.alreadyLoggedEmail).toEqual(newEmailValue);
            });

            it('should cleanup errors', () => {
                loginCustomerModel.cleanUpErrors();

                expect(loginCustomerModel.errors.length).toEqual(0);
            });

            it('should set new email value and set password to null if force', () => {
                const newEmailValue = 'test1@gmail.com';

                loginCustomerModel.onChangeEmail(newEmailValue, true);

                expect(loginCustomerModel.email).toBe(newEmailValue);
                expect(loginCustomerModel.password).toEqual('');
            });

            it('should set new email value and leave old password if no force', () => {
                const newEmailValue = 'test1@gmail.com';

                loginCustomerModel.onChangePassword('password');
                loginCustomerModel.onChangeEmail(newEmailValue, false);

                expect(loginCustomerModel.email).toBe(newEmailValue);
                expect(loginCustomerModel.password).toEqual('password');
            });
        });

        describe('rerender()', () => {
            it(`should rerender the key with random value`, () => {
                const previousRerenderKey = loginCustomerModel['rerenderKey'];
                loginCustomerModel.rerender();

                expect(loginCustomerModel['rerenderKey']).not.toEqual(previousRerenderKey);
            });
        });
    });

    describe('state changes', () => {
        describe('toggleEmailValidated()', () => {
            it(`should set appropriate isEmailValidated value`, () => {
                loginCustomerModel.toggleEmailValidated(true);

                expect(loginCustomerModel['isEmailValidated']).toBeTruthy();
            });
        });

        describe('toggleEmailExists()', () => {
            it('should set appropriate isEmailExists value', () => {
                loginCustomerModel.toggleEmailExists(true);

                expect(loginCustomerModel['isEmailExists']).toBeTruthy();
            });
        });

        describe('toggleEmailDisabled()', () => {
            it(`should set appropriate isEmailDisabled value`, () => {
                loginCustomerModel.toggleEmailDisabled(true);

                expect(loginCustomerModel['isEmailDisabled']).toBeTruthy();
            });
        });

        describe('setForceErrors', () => {
            it(`should set forceErrors to true`, () => {
                loginCustomerModel.forceErrors = false;
                loginCustomerModel.setForceErrors(true);

                expect(loginCustomerModel['forceErrors']).toBeTruthy();
            });
        });
    });

    describe('password errors', () => {
        beforeEach(() => {
            validationService.validateField = jest.fn().mockReturnValue([]);
        });

        it('should validate password for existing customer', () => {
            const errors = loginCustomerModel.passwordErrors;

            expect(validationService.validateField).toHaveBeenCalledWith(
                loginCustomerModel,
                'password',
                ValidationConfig.password,
            );
            expect(errors).toEqual([]);
        });

        it('should validate password for new customer', () => {
            loginCustomerModel.isNewCustomer = true;
            const errors = loginCustomerModel.passwordErrors;

            expect(validationService.validateField).toHaveBeenCalledWith(
                loginCustomerModel,
                'password',
                ValidationConfig.createPassword,
            );
            expect(errors).toEqual([]);
        });

        it('should return password error', () => {
            const mockErrors = { errorMessage: 'Invalid Password' };
            validationService.validateField = jest.fn().mockReturnValueOnce(mockErrors);

            expect(loginCustomerModel.passwordErrors).toEqual(mockErrors);
        });
    });

    describe('Password prohibited words', () => {
        const words = ['test', 'password'];

        it('should set words', () => {
            loginCustomerModel.setPasswordProhibitedWords(words);

            expect(loginCustomerModel.passwordProhibitedWords).toEqual(words);
        });

        it('should validate new customer password on prohibited words', () => {
            loginCustomerModel.setIsNewCustomer(true);
            loginCustomerModel.setPasswordProhibitedWords(words);
            loginCustomerModel.passwordErrors;

            expect(buildCreatePasswordValidationRules).toHaveBeenCalledWith(words);
        });
    });
});
