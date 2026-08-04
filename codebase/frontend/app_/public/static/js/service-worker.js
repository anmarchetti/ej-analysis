// show native os notification
const showNativeNotification = (title, options, swRegistration, event) => {
    swRegistration.showNotification && event.waitUntil(swRegistration.showNotification(title, options));
   
};

// subscribe to push events
self.addEventListener('push', event => {
    if (!event.data) {
        console.error('Push event but no data');
        return;
    }

    let data;

    try {
        data = event.data.json();

        if (!data || !data.title) {
            throw new Error('Push event has no valid data');
        }
    } catch (e) {
        console.error(e);
        return;
    }

    const supportedFields = [
        'body', 'icon', 'tag', 'dir', 'lang', 'silent', 'timestamp',
        'actions', 'badge', 'data', 'image', 'renotify', 'requireInteraction', 'vibrate'
    ];
    
    const options = {};
    supportedFields.forEach(field => {
        if (data[field] !== undefined) {
            options[field] = data[field];
        }
    });

    showNativeNotification(data.title, options, self.registration, event);
});

self.addEventListener('notificationclick', event => {
    event.notification.close();
    const url = event.notification.data?.url;
    if (url) {
        event.waitUntil(clients.openWindow(url));
    }
});

// save subscription to IndexedDB
const saveSubscription = async passedSubscription => {
    try {
        const subscription = passedSubscription
            ? passedSubscription
            : await self.registration.pushManager.getSubscription();

        if (subscription) {
            await set('subscription', JSON.stringify(subscription));
        }
    } finally {
    }
};

// check if previously saved subscription is still valid
const checkIfUnsubscribed = async event => {
    try {
        const [currentSub, oldSubString] = await Promise.all([
            self.registration.pushManager.getSubscription(), // current subscription
            get('subscription'), // subscription saved in IndexedDB
        ]);

        const oldSub = oldSubString ? JSON.parse(oldSubString) : undefined;

        if (currentSub) {
            /* Save current subscription to IndexedDB if
                1) there is no old subscription
                2) current subscription is different from old subscription (should never happen)
            */
            if (!oldSub || currentSub.endpoint !== oldSub.endpoint) {
                await set('subscription', JSON.stringify(currentSub));
            }
        } else if (oldSub) {
            // there is no current subscription, but there some old subscription saved, it means that user unsubscribed from notifications
            // service worker tells client app to remove unsubscribed user from server
            event.source.postMessage({
                type: 'PUSH_UNSUBSCRIBED',
                subscription: oldSub,
                apiVersion: 1,
            });

            // delete IndexedDB record, as we don't need it anymore
            del('subscription');
        }
    } catch (e) {
        // delete IndexedDB record just in case if something caused error
        del('subscription');
    }
};

// subscribe to events from client (for future)
self.addEventListener('message', event => {
    const data = event.data;

    if (!data.type) {
        return;
    }

    switch (data.type) {
        // client says that user subscribed to notifications => save subscription to database
        case 'PUSH_SUBSCRIBED':
            event.waitUntil(saveSubscription());
            return;
        // client asks to save subscription to indexDB, it means that unsubscribe request failed and should be triggered once again later
        case 'PUSH_SAVE_SUBSCRIPTION':
            event.waitUntil(saveSubscription(data.payload && data.payload.subscription));
            return;
        // client asks to check whether previous subscription is still valid
        case 'PUSH_CHECK_SUBSCRIPTION':
            event.waitUntil(checkIfUnsubscribed(event));
            return;
        default:
            return;
    }
});

// event on click on native notification
if ('onnotificationclick' in self && 'clients' in self) {
    self.onnotificationclick = event => {
        const notification = event.notification;

        // open window if there is url in data
        if (notification && notification.data && notification.data.url) {
            self.clients.openWindow && self.clients.openWindow(notification.data.url);
        }
    };
}

// get active app window (for future)
// const getActiveClient = async () => {
//     const clients = await self.clients.matchAll({ includeUncontrolled: true, type: 'window' });
//     let activeClient;

//     clients.some(client => {
//         if (client.visibilityState === 'visible') {
//             activeClient = client;
//             return true;
//         }

//         return false;
//     });

//     return activeClient;
// };

// show notifications inside app (for future)
// const showClientNotification = (client, data) => {
//     client.postMessage({
//         type: 'Worker_Notification',
//         ...data,
//     });
// };

/****************
 * IndexedDB utils
 ****************/
function promisifyDBRequest(request) {
    return new Promise(function(resolve, reject) {
        request.oncomplete = request.onsuccess = function() {
            return resolve(request.result);
        };

        request.onabort = request.onerror = function() {
            return reject(request.error);
        };
    });
}

function createStore(dbName, storeName) {
    let request = indexedDB.open(dbName);

    request.onupgradeneeded = function() {
        return request.result.createObjectStore(storeName);
    };

    let dbp = promisifyDBRequest(request);

    return function(txMode, callback) {
        return dbp.then(function(db) {
            return callback(db.transaction(storeName, txMode).objectStore(storeName));
        });
    };
}

let defaultGetStoreFunc;

function getStore() {
    if (!defaultGetStoreFunc) {
        defaultGetStoreFunc = createStore('ejHolidays', 'store');
    }

    return defaultGetStoreFunc;
}
/**
 * Get a value by its key.
 *
 * @param key
 */

function get(key) {
    return getStore()('readonly', function(store) {
        return promisifyDBRequest(store.get(key));
    });
}

/**
 * Set a value with a key.
 *
 * @param key
 * @param value
 */
function set(key, value) {
    return getStore()('readwrite', function(store) {
        store.put(value, key);
        return promisifyDBRequest(store.transaction);
    });
}

/**
 * Delete a particular key from the store.
 *
 * @param key
 */
function del(key) {
    return getStore()('readwrite', function(store) {
        store.delete(key);
        return promisifyDBRequest(store.transaction);
    });
}
