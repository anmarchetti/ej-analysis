import { ITest } from 'frontend/components/cro/Experiment/models';

/**
 * Find test in dataLayer by testId.
 * (The active test data will be pushed to dataLayer from Google Optimize and we'll check them on React).
 */

export const findTestInDataLayer = (testId: string | number): ITest | undefined => findValueInDataLayer({ testId });

export const findValueInDataLayer = (params: { [key: string]: string | number }): any => {
    if (!Object.keys(params).length) {
        return undefined;
    }

    const key = Object.keys(params)[0];
    const value = params[key];

    try {
        const test = dataLayer.find(obj => !!obj && typeof obj === 'object' && obj[key] === value);

        return test as ITest | undefined;
    } catch {}

    return undefined;
};

export const testPageLoaded = (): Nullable<boolean> => {
    try {
        // const st = dataLayer.find(obj => obj.event === 'pageload');
        return true;
    } catch {}

    return undefined;
};
