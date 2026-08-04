import express from 'express';

import { routerPublic } from './routes/public';
import { routes } from './constants';

const tradePortalApp = express();

tradePortalApp.use(routes, routerPublic);

export { routes as tradePortalRoutes };
export default tradePortalApp;
