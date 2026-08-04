import { observer } from 'mobx-react';

import { useMobileViewport } from 'frontend/hooks/useMediaQuery';
import useStore from 'frontend/hooks/useStore';
import { IHolidaysStores } from 'frontend/store/holidays';
import SitecoreDictionary from 'models/enum/SitecoreDictionary';
import Button, { IButtonProps } from 'frontend/components/common/Button';

import styles from './EditButton.module.scss';

const EditButton = ({ isLoading, children, ...rest }: IButtonProps) => {
    const { getPhrase } = useStore((stores: IHolidaysStores) => ({
        getPhrase: stores.layoutStore.getPhrase,
    }));

    const isMobile = useMobileViewport();

    return (
        <Button
            isFullWidth={isMobile}
            isMedium={!isLoading && !isMobile}
            className={styles.button}
            isOutlined
            isLoading={isLoading}
            {...rest}
        >
            {children || getPhrase(SitecoreDictionary.GlobalsButtonsEdit)}
        </Button>
    );
};

export default observer(EditButton);
