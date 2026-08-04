import { BillingInfo } from './BillingInfo';

describe('BillingInfo', () => {
    it('should create instance of BillingInfo and change fields valiues', () => {
        const obj = new BillingInfo();

        obj.onChange('fullName', 'fullName');
        obj.onChange('address', 'address');
        obj.onChange('city', 'city');
        obj.onChange('postCode', 'postCode');

        expect(obj.fullName).toBe('fullName');
        expect(obj.address).toBe('address');
        expect(obj.city).toBe('city');
        expect(obj.postCode).toBe('postCode');
    });

    it('should return true if all fields in object are populated ', () => {
        const obj = new BillingInfo();

        obj.onChange('fullName', 'fullName');
        obj.onChange('address', 'address');
        obj.onChange('city', 'city');
        obj.onChange('postCode', 'postCode');

        expect(obj.isInfoPopulated).toBeTruthy();
    });

    it('should return false if all fields in object are not populated ', () => {
        const obj = new BillingInfo();

        obj.onChange('fullName', 'fullName');
        obj.onChange('address', '');
        obj.onChange('city', '');
        obj.onChange('postCode', 'postCode');

        expect(obj.isInfoPopulated).toBeFalsy();
    });
});
