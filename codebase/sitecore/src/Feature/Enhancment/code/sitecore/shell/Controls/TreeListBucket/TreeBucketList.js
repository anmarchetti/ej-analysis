var Sitecore = Sitecore || {};

Sitecore.InitTreeListBucket = function (parameters) {
    var self = parameters;
    self.enableSetStartLocation = (parameters.enableSetStartLocation.toLowerCase() === 'true');

    self.currentPage = 1;
    self.selectedId = '';

    self.doneTypingInterval = 2000; //time in ms, 2 second for example

    self.contentLanguage = $('scLanguage') && $('scLanguage').value;

    var typingTimer;

    self.format = function (template) {
        var args = arguments;
        return template.replace(/\{(\d+)\}/g, function (m, n) { return args[parseInt(n) + 1]; });
    };

    // Sends 'GET' request to url specified by parameter
    // and apply success handler to multilist element
    self.sendRequest = function (url, data, multilist) {
        new Ajax.Request(url,
            {
                method: 'POST',
                parameters: data,
                onSuccess: new self.SuccessHandler(multilist)
            });
    };

    self.getResponse = function (responseText) {
        var formatted = responseText
            .substring(1, responseText.length - 1) // RRemove brackets from the beginning and end of text.
            .replace("\\\\", "\\\\\\\\") // Escape "\\" in the text on "\\\\".
            .replace("\\\"", "'"); // Escape "\"" in the text on "'".
        var response = JSON.parse(formatted);
        return response;
    }

    // Cunstructor for request success handler
    self.SuccessHandler = function (multilist) {
        return function (request) {
            var response = self.getResponse(request.responseText);
            if (!multilist) {
                return;
            }
            multilist.options.length = 0;
            multilist.removeClassName('loadingItems');


            var itemIdsHash = {};
            var reducedItems = [];
            var i;
            var item;
            for (i = 0; i < response.items.length; i++) {
                item = response.items[i];

                if (!itemIdsHash[item.ItemId]) {
                    itemIdsHash[item.ItemId] = true;
                    reducedItems[reducedItems.length] = item;
                }
            }

            for (i = 0; i < reducedItems.length; i++) {
                item = reducedItems[i];
                const itemName = self.getItemName(item);
                multilist.options[multilist.options.length] = new Option(itemName + ' (' + item.TemplateName + (item.Bucket && (' - ' + item.Bucket)) + ')' , item.ItemId);

            }

            self.pageNumber = response.PageNumbers;
            self.currentPage = response.CurrentPage;
            $('pageNumber' + self.clientId).innerHTML = self.format(self.of, self.currentPage, self.pageNumber);
        };
    };

    self.getItemName = function(item) {
        const itemName = item.Name; 
        return itemName;
    };

    // Return id of selected item
    self.getSelectedItemId = function (controlSuffix) {
        var all = scForm.browser.getControl(self.id + controlSuffix);

        for (var n = 0; n < all.options.length; n++) {
            var option = all.options[n];

            if (option.selected) {
                return option.value;
            }
        }

        return null;
    };

    self.onFilterFocus = function (filterBox) {
        if (!filterBox) {
            return;
        }
        if (filterBox.value == self.typeToSearchString) {
            filterBox.value = '';
        }

        filterBox.addClassName('active').removeClassName('inactive');
    };

    self.onFilterBlur = function (filterBox) {
        if (!filterBox) {
            return;
        }
        if (!filterBox.value) {
            filterBox.value = self.typeToSearchString;
        }

        filterBox.removeClassName('active').addClassName('inactive');
    };

    self.moveToCurrentPage = function () {
        var filterBox = document.getElementById('filterBox' + self.clientId);
        var multilist = $(self.clientId + '_unselected_items')?.addClassName('loadingItems');
        if (!filterBox && !multilist) {
            return;
        }
        var filterValue = (filterBox?.value && filterBox.value != self.typeToSearchString) ? filterBox.value : '*';

        var savedStr = encodeURIComponent(filterValue);
        var filterString = self.enableSetStartLocation ? self.getOverrideString('%2Blocation=') : self.filter;

        self.sendRequest(self.searchHandlerUrl, 'fromBucketListField=' + savedStr + "&" + filterString.replace(/\+/g, "%2B") + '&pageNumber=' + self.currentPage + self.databaseUrlParameter + '&scLanguage=' + self.contentLanguage, multilist);
    };

    // Replaces overrideKey value in filter by value from ovverrideInput
    self.getOverrideString = function (overrideKey) {
        var overrideInput = document.getElementById('locationOverride' + self.clientId);

        if (!overrideInput || !overrideInput.value.length > 0) {
            return self.filter;
        }

        var replaceStartIndex = self.filter.indexOf(overrideKey);

        if (!~replaceStartIndex) {
            return self.filter;
        }

        var replaceEndIndex = self.filter.indexOf('&', replaceStartIndex + 1);

        if (!~replaceEndIndex) {
            replaceEndIndex = self.filter.length;
        }

        var stringToReplace = self.filter.substring(replaceStartIndex, replaceEndIndex);

        return self.filter.replace(stringToReplace, overrideKey + overrideInput.value);
    };

    self.getSelectedIdsFilter = function () {
        return [].slice.call($(self.clientId + '_selected').options, 0)
            .map(function (option) { return "&-id=" + option.value })
            .join('');
    };

    self.switchControlButtons = function (value) {
        document.getElementById(self.clientId + "_right_treelist").style.display = value ? 'none' : 'block';
        document.getElementById(self.clientId + "_right_search_results").style.display = value ? 'block' : 'none';
    };

    self.initEventHandlers = function () {
        $('filterBox' + self.clientId).observe('focus', function () {
            self.onFilterFocus($('filterBox' + self.clientId));
        });

        $('filterBox' + self.clientId).observe('blur', function () {
            self.onFilterBlur($('filterBox' + self.clientId));
        });

        $('filterBox' + self.clientId).observe('keyup', function () {
            typingTimer = setTimeout(function () { self.currentPage = 1; self.moveToCurrentPage(); }, self.doneTypingInterval);
            self.switchControlButtons(this.value);
            document.getElementById(self.allId).style.display = this.value ? "none" : "block";
            document.getElementById(self.unselectedId).style.display = this.value ? "block" : "none";
        });

        $('filterBox' + self.clientId).observe('keydown', function () {
            clearTimeout(typingTimer);
            self.switchControlButtons(this.value);
        });

        $('next' + self.clientId).observe('click', function () {
            if (self.currentPage + 1 <= self.pageNumber) {
                self.currentPage++;
                self.moveToCurrentPage();
            }
        });

        $('prev' + self.clientId).observe('click', function () {
            if (self.currentPage > 1) {
                self.currentPage--;
                self.moveToCurrentPage();
            }
        });

        $(self.id + '_unselected_items').observe('click', function () {
            self.selectedId = self.getSelectedItemId('_unselected_items');
        });

        $('refresh' + self.clientId).observe('click', function () {
            self.currentPage = 1;
            self.moveToCurrentPage();
        });

        $('goto' + self.clientId).observe('click', function () {
            scForm.postRequest('', '', '', 'contenteditor:launchtab(url=' + self.selectedId + ', la=' + self.contentLanguage + ')');
            return false;
        });
    };

    var pageNumberElement = $('pageNumber' + self.clientId);
    if (pageNumberElement) {
        pageNumberElement.innerHTML = self.format(self.of, self.currentPage, self.pageNumber);
        self.initEventHandlers();
        self.moveToCurrentPage();
    }
};