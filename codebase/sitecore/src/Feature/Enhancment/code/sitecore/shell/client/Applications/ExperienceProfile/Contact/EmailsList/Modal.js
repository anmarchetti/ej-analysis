define(function () {
    selectedItemIdProperty = "selectedItemId"
    var id;
    var settings;
    var getHeader;
    var getBody;

    var closeModal = function (event) {
        var closestParent = event.closest(settings.selectorTarget),
            childrenTrigger = document.querySelector('[aria-controls="' + closestParent.id + '"');
        closestParent.classList.remove(settings.visibleClass);
        document.documentElement.style.overflow = '';
        setTimeout(function () {
            closestParent.classList.remove(settings.activeClass);
        }, settings.speedClose);
    };

    var clickHandler = function (event) {
        var toggle = event.target,
            open = toggle.closest(settings.selectorTrigger),
            close = toggle.closest(settings.selectorClose);
        if (open) {
            openModal(open);
        }
        if (close) {
            closeModal(close);
        }
        if (open || close) {
            event.preventDefault();
        }
    };

    var keydownHandler = function (event) {
        if (event.key === 'Escape' || event.keyCode === 27) {
            var modals = document.querySelectorAll(settings.selectorTarget),
                i;
            for (i = 0; i < modals.length; ++i) {
                if (modals[i].classList.contains(settings.activeClass)) {
                    closeModal(modals[i]);
                }
            }
        }
    };

    function escape(htmlStr) {
        return htmlStr.replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#39;");
    }

    var openModal = function (trigger, update) {
        if (update){
            var headerValue = getHeader();
            var bodyValue = getBody();

            document.getElementById(`modal_content_body_${id}`).innerHTML = "<iframe srcdoc='" + escape(bodyValue) + "' style=\"display: block !important\" frameborder=\"0\" scrolling=\"no\" height=\"100%\" width=\"100%\"></iframe>";
            document.getElementById(`modal_content_header_${id}`).innerHTML = headerValue;
        }
        var target = document.getElementById(trigger);
        target.classList.add(settings.activeClass);
        document.documentElement.style.overflow = 'hidden';
        setTimeout(function () {
            target.classList.add(settings.visibleClass);
        }, settings.speedOpen);
    };

    var modal = function () {
        /**
        * Element.closest() polyfill
        * https://developer.mozilla.org/en-US/docs/Web/API/Element/closest#Polyfill
        */
        if (!Element.prototype.closest) {
            if (!Element.prototype.matches) {
                Element.prototype.matches = Element.prototype.msMatchesSelector || Element.prototype.webkitMatchesSelector;
            }
            Element.prototype.closest = function (s) {
                var el = this;
                var ancestor = this;
                if (!document.documentElement.contains(el)) return null;
                do {
                    if (ancestor.matches(s)) return ancestor;
                    ancestor = ancestor.parentElement;
                } while (ancestor !== null);
                return null;
            };
        }

        document.addEventListener('click', clickHandler, false);
        document.addEventListener('keydown', keydownHandler, false);

    };
    return {
        insertModal: function (nodeToInsertInto, modalId, modalSettings) {
            var rawHtml = `<section class="modal" id="${modalId}" data-modal-target>
            <div class="modal__overlay" data-modal-close tabindex="-1"></div>
            <div class="modal__wrapper">
            <div class="modal__header">
                <div id="modal_content_header_${modalId}" class="modal__title">
                Header Title
                </div>
                <button class="modal__close" data-modal-close aria-label="Close Modal"></button>
            </div>
            <div id="modal_content_body_${modalId}" class="modal__content">
            </div>
            </div>
            </section>`;

            const newNode = new DOMParser().parseFromString(rawHtml, 'text/html').body.firstElementChild;

            nodeToInsertInto.insertBefore(newNode, nodeToInsertInto.childNodes[0]);

            id = modalId;
            settings = modalSettings;
        },

        subscribeDialog: function (listControl, getHeaderFun, getBodyFunc, app) {
            getHeader = getHeaderFun;
            getBody = getBodyFunc;
            modal();
            listControl.on("change:" + selectedItemIdProperty, function () {
                if (!listControl.get(selectedItemIdProperty)) return;

                var newSelectedItemId = listControl.get(selectedItemIdProperty);
                var itemChanged = newSelectedItemId !== currentItemId;
                var currentItemId = newSelectedItemId;
                openModal(id, itemChanged);
                listControl.set(selectedItemIdProperty, null);
            }, app);
        }
    };
});