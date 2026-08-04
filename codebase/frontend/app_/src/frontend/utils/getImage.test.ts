import { ImageSize } from 'models/enum/ImageSize';

import { getImage } from './getImage';

describe('getImage', () => {
    let imageOnload: () => void;
    let imageOnError: () => void;

    beforeAll(() => {
        Object.defineProperty(Image.prototype, 'onload', {
            get: function () {
                return this._onload;
            },
            set: function (fn) {
                imageOnload = fn;
                this._onload = fn;
            },
        });

        Object.defineProperty(Image.prototype, 'onerror', {
            get: function () {
                return this._onerror;
            },
            set: function (fn) {
                imageOnError = fn;
                this._onerror = fn;
            },
        });
    });

    const image = {
        large: 'large',
        medium: 'medium',
        small: 'small',
    };

    it('should return largest image url by default', done => {
        const img = getImage(image);
        imageOnload();

        img.then(res => {
            done();
            expect(res).toBe('large');
        });
    });

    it('should use defaultSize param', done => {
        const img = getImage(image, ImageSize.Medium);
        imageOnload();

        img.then(res => {
            done();
            expect(res).toBe('medium');
        });
    });

    it('should return first available image', done => {
        const img = getImage(image);
        imageOnError();
        imageOnload();

        img.then(res => {
            done();
            expect(res).toBe('medium');
        });
    });
});
