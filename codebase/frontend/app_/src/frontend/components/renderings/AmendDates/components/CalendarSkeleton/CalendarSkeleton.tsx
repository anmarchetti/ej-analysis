import styles from './CalendarSkeleton.module.scss';

const Skeleton = () => (
    <div className={styles.skeleton} data-tid='calendar-skeleton'>
        <div className={styles.header}>
            <div className='placeholder-shimmer' />
            <div className='placeholder-shimmer' />
        </div>
        <div className={styles.body}>
            <div className='placeholder-shimmer' />
            <div className='placeholder-shimmer' />
            <div className='placeholder-shimmer' />
            <div className='placeholder-shimmer' />
            <div className='placeholder-shimmer' />
        </div>
    </div>
);

const CalendarSkeleton = () => (
    <div className={styles.wrap}>
        <Skeleton />
        <Skeleton />
    </div>
);

export default CalendarSkeleton;
