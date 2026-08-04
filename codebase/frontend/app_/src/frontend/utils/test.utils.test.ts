import { getSitecoreFieldsBunch, mockSitecoreCompositeField } from './tests.utils';

describe('test.utils', () => {
    describe('getSitecoreFieldsBunch', () => {
        it('Should return various types of sitecore fields from array', () => {
            const result = getSitecoreFieldsBunch(['String', { Image: 'image' }, { Link: 'link' }]);

            expect(result).toMatchObject({
                Image: { value: { src: 'Image' } },
                Link: { value: { href: 'Link', linktype: 'internal', text: 'Link' } },
                String: { value: 'String' },
            });
        });

        it('should NOT include unexpected data in result', () => {
            // @ts-ignore
            const result = getSitecoreFieldsBunch([{ Test: 'test' }]);

            expect(result).toMatchObject({});
        });
    });

    describe('mockSitecoreCompositeField', () => {
        it('should return valid sitecore fields from composite field', () => {
            const result = mockSitecoreCompositeField(
                '13jdw-ve3js2-dfews',
                { Test: { Field: { Value: 'Test' } } },
                'url',
            );

            expect(result).toMatchObject({
                id: '13jdw-ve3js2-dfews',
                fields: { Test: { Field: { Value: 'Test' } } },
                url: 'url',
            });
        });
    });
});
