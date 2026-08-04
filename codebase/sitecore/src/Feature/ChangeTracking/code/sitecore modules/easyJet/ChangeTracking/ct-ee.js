/*!
[ExcludeFromCodeCoverage]
*/

class MasterChanges {

    async init() {
        var elements = document.querySelectorAll("a[href='#showMasterChanges']");
        for (var i = 0; i < elements.length; i++) {
            elements[i].addEventListener("click", x => this.showDetails(x.target));
        }
    }

    async showDetails(aTag) {

        function printFieldChange(change) {
            markup += "<li>"
            markup += change.FieldName + " was edited";
            markup += "<div class='easyJet-ee-ct-diffwrapper'><div class='easyJet-ee-ct-diff'>";
            let oldVal = htmlEncode(change.OldValue);
            let newVal = htmlEncode(change.NewValue);
            let diff = JsDiff.diffWords(oldVal, newVal);
            diff.forEach(function (part) {
                let color = part.added ? 'easyJet-ee-ct-green' :
                    part.removed ? 'easyJet-ee-ct-red' : 'easyJet-ee-ct-grey';
                markup += "<span class='" + color + "'>" + part.value + "</span>";
            });
            markup += "</div></div></li>";
        }

        function printItemAdded(change) {
            markup += "<li>Item added: " + change.Path;
            if (!change.IsApplied) {
                markup += " <a href=\"javascript:Sitecore.PageModes.PageEditor.postRequest('embedded:sync(id={" +
                    change.ItemId.Guid +
                    "})',null,false)\">Sync</a>";
            }

            markup += "</li>";
        }
        function printItemDeleted(change) {
            markup += "<li>Item deleted: " + change.Path + "</li>";
        }
        function printSortOrderChanged() {

            function printOrder(data) {
                return "<ul>" + data.map(x => "<li>" + x + "</li>").join("") + "</ul>";
            }

            if (data.OldChildrenSortOrder) {
                markup += "<li>Children sort order changed. New order:" + printOrder(data.NewChildrenSortOrder) + " Previous order: " + printOrder(data.OldChildrenSortOrder) +  "</li>";
            }
        }

        let uri = aTag.dataset.uri;
        let data = await this.loadData(uri);

        let popup = document.createElement("div");
        popup.classList.add("easyJet-ee-ct-dialog");
        popup.classList.add("easyJet-ee-ct-centered");
        document.body.appendChild(popup);

        let markup = "<ul>";
        data.ChangedFields.forEach(printFieldChange);
        data.ItemsAdded.forEach(printItemAdded);
        data.ItemsDeleted.forEach(printItemDeleted);
        printSortOrderChanged();
        markup += "</ul>";

        popup.innerHTML = "<div class='easyJet-ee-ct-headline'>" + data.Title  + "</div><div class='easyJet-ee-ct-dialog-close'>X</div>" + markup;

        popup.addEventListener("click",
            x => {
                if (x.target.classList.contains("easyJet-ee-ct-dialog-close"))
                    this.closeDialog(popup);
            });

        function htmlEncode(value) {
            var el = document.createElement('div');
            el.innerText = value;
            return el.innerHTML;
        }
    }

    closeDialog(element) {
        element.remove();
    }

    async loadData(uri) {
        let response = await fetch("easyJet/changetracking/master/data?uri=" + encodeURIComponent(uri));
        let json = await response.json();
        return json;
    }
}

let alpacaMasterChanges = new MasterChanges();
alpacaMasterChanges.init();