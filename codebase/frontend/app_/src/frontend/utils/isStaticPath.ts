import SitePath from 'models/enum/SitePath';

const isStaticPage = (path: string) => {
    const pathInLowerCase = path.toLowerCase();

    return Object.keys(SitePath).some(key => SitePath[key].toLowerCase() === pathInLowerCase);
};

export default isStaticPage;
