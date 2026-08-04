import { FC } from 'react';
import dayjs from 'dayjs';

interface IMonthProps {
    month: number;
}

const Month: FC<IMonthProps> = ({ month }) => <span>{dayjs.monthsShort()[month]}</span>;

export default Month;
