import SitePath from 'models/enum/SitePath';

import { submitForm } from './submitForm';

describe('submitForm util', () => {
    it('should create form with appropriate elements and submit right value', () => {
        const action = `/en/holidays${SitePath.ViewBooking}`;
        const name = 'view-booking-payload';
        const submitValue = {
            bookingReference: '123435',
            date: '2021-03-12',
            lastName: 'lastName',
            isBackToPageClicked: true,
        };

        window.HTMLFormElement.prototype.submit = jest.fn();
        submitForm(action, name, submitValue);

        const formElement = document.getElementsByTagName('form')[0];
        const inputElement = document.getElementsByTagName('input')[0];

        expect(formElement).toBeDefined();
        expect(inputElement).toBeDefined();
        expect(formElement.action).toEqual('http://localhost/en/holidays/booking/my_booking');
        expect(formElement.method.toUpperCase()).toEqual('POST');
        expect(inputElement.name).toEqual(name);
        expect(JSON.parse(inputElement.value)).toEqual(submitValue);
        expect(window.HTMLFormElement.prototype.submit).toHaveBeenCalled();
    });
});
