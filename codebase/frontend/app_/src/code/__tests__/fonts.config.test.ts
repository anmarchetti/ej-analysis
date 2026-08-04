import { fontsConfig, fontsUrl } from 'code/fonts.config';

describe('Font Config', () => {
    it('Fonts url', () => {
        expect(fontsUrl).toBe('');
    });

    it('Fonts config', () => {
        expect(fontsConfig[0].family).toBe('easyjet_generation_headline');
    });
});
