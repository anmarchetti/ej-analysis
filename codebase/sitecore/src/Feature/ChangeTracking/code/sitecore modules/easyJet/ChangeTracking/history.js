/*!
[ExcludeFromCodeCoverage]
*/
class History {

    async init() {
        let container = document.getElementById("container");
        container.addEventListener("click", x => this.toggleChanges(x.target));
        container.addEventListener("click", x => this.openEditor(x.target));
        document.getElementById("reloadButton").addEventListener("click", () => this.reload());
        await this.load(container);
    }

    async load() {
        async function loadData() {
            let uri = document.body.dataset.uri;
            let response = await fetch("/easyJet/changetracking/history/data?uri=" + encodeURIComponent(uri));
            let json = await response.json();
            return json;
        }

        function printChangeSet(changeSet, list) {

            function decodeDate(value) {
                return new Date(parseInt(value.substr(6)))
            }

            function formatDate(value) {
                return value.toLocaleDateString();
            }

            function printDateIfNewDate(start) {
                var dateStr = formatDate(start);
                if (currentDate != dateStr) {
                    currentDate = dateStr;
                } else
                    dateStr = "&nbsp;";
                markup += "<div class='tl-date'>" + dateStr + "</div>";
            }

            function printVersions() {
                if (changeSet.Versions.length) {
                    markup += "<ul class='tl-versions'>" + changeSet.Versions.map(x => "<li>V " + x + "</li>").join() + "</ul>";
                }
            }

            function printItemChangeSet(itemChangeSet, changeSetId) {

                function printChanges() {
                    markup += "<div class='cs-item'" + (itemChangeSet.EditorUrl ? " data-openuri='" + itemChangeSet.EditorUrl + "'" : "") + ">"
                        + (itemChangeSet.Path || "Item") + "</div>";

                    let ulId = changeSetId + "|" + itemChangeSet.ItemId.Guid;
                    markup += "<ul id='" + ulId + "' class='tl-changes'>";
                    itemChangeSet.Changes.forEach((change, index) => printChange(change, ulId, index));
                    markup += "</ul>";
                }

                function printChange(change, ulId, index) {
                    let oldVal = htmlEncode(change.OldValue);
                    let newVal = htmlEncode(change.NewValue);

                    if (oldVal.length < 1000 && newVal.length < 1000) {
                        Diff.diffWords(oldVal, newVal, function (err, diff) {
                            return jsDiffCallback(err, diff);
                        });
                    } else {
                        setTimeout(function () {
                            return jsDiffCallback("field value is too long, color highlighting has been disabled.", []);
                        }, 1000);
                    }

                    function jsDiffCallback(err, diff) {
                        let markup = "<span>" + decodeDate(change.Time).toLocaleTimeString() + "</span> ";
                        if (change.Field) {
                            if (change.Field === "Children") {
                                markup += "Children were reordered";
                            } else {
                                markup += change.Field + " was edited";
                                markup += "<div class='diffwrapper'><div class='diff'>";

                                if (err) {
                                    markup += "<div><span class='red'>" + err + "</span></div>";
                                    markup += "</br></br>";
                                    markup += "<div>old value: </div><span class='grey'>" + oldVal + "</span>";
                                    markup += "</br></br>";
                                    markup += "<div>new value: </div><span class='grey'>" + newVal + "</span>";
                                } else {
                                    diff.forEach(function (part) {
                                        let color = part.added ? 'green' :
                                            part.removed ? 'red' : 'grey';
                                        markup += "<span class='" + color + "'>" + part.value + "</span>";
                                    });
                                }
                                markup += "</div></div>";
                            }
                        }
                        if (change.Action == "D") {
                            markup += "<span class='delete'>Item was deleted</span>";
                        }
                        if (change.Action == "C") {
                            markup += "<span class='create'>Item was created: " + change.Path + "</span>";
                        }
                        if (change.Action == "R") {
                            markup += "<span class='create'>Item was renamed to " + change.Path + " </span>";
                        }
                        if (change.Action == "A") {
                            markup += "<span class='versionadded'>Version was added</span>";
                        }
                        if (change.Action == "M") {
                            markup += "<span class='versionadded'>Item moved from " + change.OldPath + "</span>";
                        }

                        let li = document.createElement("li");
                        li.dataset.changeIndex = index;
                        li.innerHTML = markup;
                        document.getElementById(ulId).appendChild(li);

                        // sort elements (list of changes should be sorted)
                        sortChangesList(document.getElementById(ulId));
                    }

                    function sortChangesList(parentUl) {
                        var liElements = parentUl.querySelectorAll('[data-change-index]');

                        Array.from(liElements)
                            .sort((a, b) => parseInt(a.dataset.changeIndex, 10) - (parseInt(b.dataset.changeIndex, 10)))
                            .forEach(el => el.parentNode.appendChild(el));
                    }
                }

                printChanges();
            }


            let entry = document.createElement("li");
            let start = decodeDate(changeSet.SessionStart);
            let end = decodeDate(changeSet.SessionEnd);

            let markup = "";

            printDateIfNewDate(start);

            markup += "<div class='tl-item'><div>" + start.toLocaleTimeString();
            printVersions();

            markup += "<div class='tl-changes-summary'>" +
                changeSet.NumChanges +
                " changes by " +
                changeSet.Author + " (" + moment.duration(end - start).humanize() +
                ")</div><div class='hidden tl-changes-container'>";

            let changeSetId = generateHash(changeSet.SessionStart);
            changeSet.Items.forEach(function (x) { printItemChangeSet(x, changeSetId); });

            markup += "</div></div>";

            entry.innerHTML = markup;

            list.appendChild(entry);

            function htmlEncode(value) {
                var el = document.createElement('div');
                el.innerText = value;
                return el.innerHTML;
            }

            function generateHash(value) {
                var hash = 0;
                if (value.length == 0) {
                    return hash;
                }
                for (var i = 0; i < value.length; i++) {
                    var char = value.charCodeAt(i);
                    hash = ((hash << 5) - hash) + char;
                    hash = hash & hash; // Convert to 32bit integer
                }
                return hash;
            }
        }

        let data = await loadData();
        container.innerHTML = "";
        container.classList.add('timeline');
        let list = document.createElement("ul");
        container.appendChild(list);

        let currentDate = "";
        data.forEach(x => printChangeSet(x, list));

        if (!data.length) {
            container.innerHTML = "<div class='tl-no-changes'>No changes have been recorded yet.</div>";
        }

    }

    reload() {
        this.load();
    }

    openEditor(targetEl) {
        if (targetEl.dataset.openuri) {
            window.parent.scForm.showModalDialog(targetEl.dataset.openuri, null, "dialogWidth:1200px;dialogHeight:740px;help:no;scroll:auto;resizable:yes;maximizable:yes;closable:yes;center:yes;status:no;header:;autoIncreaseHeight:yes;forceDialogSize:no");
        }
    }

    toggleChanges(targetEl) {
        if (targetEl.classList.contains("tl-changes-summary")) {
            targetEl.nextElementSibling.classList.toggle("hidden");
        }
    }
}

let viewer = new History();
viewer.init();