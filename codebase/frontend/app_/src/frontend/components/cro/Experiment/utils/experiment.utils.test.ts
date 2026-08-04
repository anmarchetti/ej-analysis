import { ITest } from 'frontend/components/cro/Experiment/models';

import { findTestInDataLayer } from './experiment.utils';

Object.defineProperties(window, {
    dataLayer: { value: [] as any, writable: true },
});

describe('Experiment utils', () => {
    describe('findTestInDataLayer', () => {
        it('should return undefined when dataLayer is not defined', () => {
            dataLayer = undefined;

            const res = findTestInDataLayer('testId');

            expect(res).toBeUndefined();
        });

        it('should return undefined when no test in dataLayer', () => {
            dataLayer = [];
            const res = findTestInDataLayer('testId');

            expect(res).toBeUndefined();
        });

        it('should return test from dataLayer', () => {
            const testExperiment = { testId: 'testId', testVariant: 'testVariant' } as ITest;
            dataLayer = [testExperiment];
            const res = findTestInDataLayer('testId');

            expect(res).toBe(testExperiment);
        });
    });
});
