import Button from 'frontend/components/common/Button';
import SvgExternalLink from 'frontend/components/icons-new/ExternalLink';

import styles from './ShowMoreAction.module.scss';

export interface IShowMoreActionProps {
    label?: string;
    onClick?: () => void;
}

const ShowMoreAction = ({ onClick, label }: IShowMoreActionProps) => (
    <Button
        isOutlined
        isFullWidth
        onClick={onClick}
        data-tid='show-more-rooms-button-mobile'
        className={styles.showMore}
        aria-label={label}
    >
        {label}
        <SvgExternalLink className={styles.btnIcon} />
    </Button>
);

export default ShowMoreAction;
