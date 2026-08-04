import express, { NextFunction, Request, Response } from 'express';

import { checkIfEmailValid } from 'frontend/utils/validation.utils';
import { QueryParamName } from 'models/enum/QueryParamName';
import SitePath from 'models/enum/SitePath';

export const noCacheHandler = (req: Request, res: Response, next: NextFunction): void => {
    res.append('Cache-control', 'no-store, no-cache');

    next();
};

const noAnalyticsHandler = (req: Request, res: Response, next: NextFunction): void => {
    res.locals.noAnalytics = true;

    next();
};

// mark page as POST page, so we can fix history in _document.js
const isPostPageHandler = (req: Request, res: Response, next: NextFunction): void => {
    res.locals.isPostPage = req.method === 'POST';

    next();
};

export const routerPublic = express.Router();

routerPublic.use(express.urlencoded({ extended: true }));

// special handlers for post pages
routerPublic.post(
    [SitePath.Payment, SitePath.PayBalance, SitePath.AmendPayment],
    noCacheHandler,
    noAnalyticsHandler,
    isPostPageHandler,
);

routerPublic.post([SitePath.BookingConfirmation, SitePath.ViewBooking], noCacheHandler, isPostPageHandler);

/**
 * endpoint for setting EJH header (needed for testing purposes)
 */
routerPublic.get('/switch', (req, res) => {
    if (req.query.ejh !== undefined) {
        if (req.query.ejh === '') {
            res.clearCookie('EJH');
        } else if (req.query.ejh === 'green' || req.query.ejh === 'blue') {
            res.cookie('EJH', req.query.ejh, {
                expires: new Date(Date.now() + 24 * 60 * 60 * 1000), // 1 day
            });
        }
    }

    res.send('Success');
});

/**
 * 1) Prevent going to marketing research unsubscribe page if no encEmail or no email or email is not valid
 * 2) If user is already unsubscribed, show page in unsubscribed state (see https://jira.build.easyjet.com/browse/EJH-13779)
 */
routerPublic.get(SitePath.MarketingResearchUnsubscribe, async (req, res, next) => {
    const encEmail = req.query[QueryParamName.EncEmail];
    const email = req.query[QueryParamName.Email];

    // for now we allow both email and encEmail for smooth transition
    if ((typeof email == 'string' && checkIfEmailValid(email)) || typeof encEmail === 'string') {
        next();

        return;
    }

    res.redirect(req.baseUrl);
});

/**
 * Get booking confirmation
 */
routerPublic.get([SitePath.Payment, SitePath.BookingConfirmation], (req, res) => {
    res.redirect(res.locals.basePath);
});

// We should not access Confirm Holiday Credit page from direct hit
routerPublic.get([SitePath.ConfirmHolidayCredit], (req, res) => {
    res.redirect(`${req.baseUrl}${SitePath.ViewBookings}`);
});
