import { useEffect, useState } from 'react';

const SEXAGESIMAL = 60;
const SECOND = 1000;
const MINUTE = SECOND * SEXAGESIMAL;
const HOUR = MINUTE * SEXAGESIMAL;
const HOURS_PER_DAY = 24;

const useCountdown = (deadline: string): null | { [key: string]: number } => {
    const [countdown, setCountdown] = useState(new Date(deadline).getTime() - new Date().getTime());

    useEffect(() => {
        const deadlineNumber = new Date(deadline).getTime();

        const timeout = setInterval(() => {
            const difference = deadlineNumber - new Date().getTime();

            if (!Number.isNaN(difference)) {
                setCountdown(difference);
            }

            if (Number.isNaN(difference) || difference <= 0) {
                clearInterval(timeout);
            }
        }, SECOND);

        return () => clearInterval(timeout);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    if (Number.isNaN(countdown) || countdown <= 0) return null;

    return {
        days: Math.floor(countdown / (HOUR * HOURS_PER_DAY)),
        hours: Math.floor((countdown % (HOUR * HOURS_PER_DAY)) / HOUR),
        minutes: Math.floor((countdown % HOUR) / MINUTE),
        seconds: Math.floor((countdown % MINUTE) / SECOND),
    };
};

export default useCountdown;
