import { FC, useState } from 'react';
import classNames from 'classnames';

import useStore from 'frontend/hooks/useStore';
import Button from 'frontend/components/common/Button';

import styles from './ManageHubCTA.module.scss';

export interface IManageHubCTAProps {
    label: string | undefined;
    buttonClass?: string;
}

export const ManageHubCTA: FC<IManageHubCTAProps> = ({ label, buttonClass }) => {
    const [isLoading, setIsLoading] = useState(false);

    const { trackManageHubClick, redirectToManageHubPage } = useStore(stores => ({
        trackManageHubClick: stores.trackingStore.trackManageHubClick,
        redirectToManageHubPage: stores.routerStore.redirectToManageHubPage,
    }));

    const onClick = async (): Promise<void> => {
        setIsLoading(true);
        await trackManageHubClick();

        redirectToManageHubPage();
        setIsLoading(false);
    };

    return (
        <Button
            //Styling is different from regular outlined button, so we use custom class
            className={classNames(styles.btn, buttonClass)}
            dataTid='manage-holiday-btn'
            onClick={onClick}
            isMedium
            isLoading={isLoading}
        >
            {label}
        </Button>
    );
};
