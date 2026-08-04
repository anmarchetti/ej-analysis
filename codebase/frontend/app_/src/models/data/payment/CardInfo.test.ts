import { CardType } from 'models/enum/CardType';

import { CardInfo } from './CardInfo';

describe('CardInfo.test', () => {
    it('should create instance of CardInfo and change fields values', () => {
        const obj = new CardInfo();

        obj.onChange('issueNumber', 'issueNumber');
        obj.onChange('cardNumber', 'cardNumber');
        obj.onChange('expirationDate', 'expirationDate');
        obj.onChange('cvv', 'cvv');
        obj.onChange('nameOnCard', 'nameOnCard');

        expect(obj.nameOnCard).toBe('nameOnCard');
        expect(obj.cardNumber).toBe('cardNumber');
        expect(obj.expirationDate).toBe('expirationDate');
        expect(obj.cvv).toBe('cvv');
        expect(obj.issueNumber).toBe('issueNumber');
    });

    it('should return card type based on card number', () => {
        const obj = new CardInfo();

        obj.onChange('cardNumber', '344238716403663');

        expect(obj.cardType).toEqual(CardType.AmericanExpress);
    });
});
