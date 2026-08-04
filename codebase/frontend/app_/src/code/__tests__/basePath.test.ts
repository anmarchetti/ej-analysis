import { buildBasePathByLang } from 'code/basePath';

describe('basePath', () => {
    describe('buildBasePathByLang', () => {
        it('should return base path for holidays', () => {
            const isTradePortal = false;
            const res = buildBasePathByLang('ch-fr', isTradePortal);

            expect(res).toEqual('/ch-fr/vacances');
        });

        it('should return base path for trade portal', () => {
            const isTradePortal = true;
            const res = buildBasePathByLang('en', isTradePortal);

            expect(res).toEqual('/en/holidays/trade-portal');
        });

        it('should return en base path when lang not supported', () => {
            const isTradePortal = false;
            const res = buildBasePathByLang('lang', isTradePortal);

            expect(res).toEqual('/en/holidays');
        });
    });
});
