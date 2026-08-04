import { useEffect, useState } from 'react';

import { ITest } from 'frontend/components/cro/Experiment/models';
import { findTestInDataLayer } from 'frontend/components/cro/Experiment/utils/experiment.utils';

const INTERVAL_TIME = 1000;
const maxLoad = 8;

const useExperiment = (testId: string | number): Nullable<ITest> => {
    const [variant, setVariant] = useState<ITest | undefined>(undefined);

    useEffect(() => {
        const immediate = findTestInDataLayer(testId);

        if (immediate) {
            setVariant(immediate);

            return;
        }

        let loaded = 0;
        const intervalId = setInterval(() => {
            const variant = findTestInDataLayer(testId);
            loaded++;

            if (variant) {
                setVariant(variant);
                clearInterval(intervalId);
            }

            if (variant === undefined && loaded > maxLoad) {
                setVariant(variant);
                clearInterval(intervalId);
            }
        }, INTERVAL_TIME);

        return () => {
            clearInterval(intervalId);
        };
    }, [testId]);

    return variant;
};

export default useExperiment;
