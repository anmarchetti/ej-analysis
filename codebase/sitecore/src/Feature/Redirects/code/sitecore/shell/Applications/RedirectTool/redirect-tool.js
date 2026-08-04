/* global $, window */
(function () {
  var siteName = "shell";

  function withSite(url) {
    if (!siteName) {
      return url;
    }
    return url + (url.indexOf("?") === -1 ? "?" : "&") + "sc_site=" + encodeURIComponent(siteName);
  }

  var endpoints = {
    list: withSite("/api/RedirectTool/List"),
    exportCsv: withSite("/api/RedirectTool/ExportCsv"),
    importCsv: withSite("/api/RedirectTool/ImportCsv"),
    upsert: withSite("/api/RedirectTool/Upsert"),
    deleteRule: withSite("/api/RedirectTool/Delete"),
    testUrl: withSite("/api/RedirectTool/TestUrl"),
    publish: withSite("/api/RedirectTool/Publish"),
    templateChildren: withSite("/api/RedirectTool/TemplateChildren"),
    languages: withSite("/api/RedirectTool/Languages")
  };

  var state = {
    rules: [],
    filtered: [],
    sortField: "fromUrl",
    sortDir: "asc",
    pageSize: 20,
    pageIndex: 1,
    selectedId: null,
    collapsedGroups: {},
    templatePicker: {
      loaded: {},
      selected: {}
    },
    languagesPicker: {
      options: [],
      loaded: false,
      selected: {}
    }
  };

  function setLoader(active) {
    $("#rt-loader").toggleClass("is-active", active);
  }

  function setPickerLoading(active) {
    $("#rt-template-loading").toggle(active);
  }

  function setMessage(text, type) {
    var $message = $("#rt-message");
    $message.removeClass("success error");
    if (type) {
      $message.addClass(type);
    }
    $message.text(text || "");
  }

  function escapeHtml(value) {
    var safeValue = value === null || value === undefined ? "" : value;
    return String(safeValue).replace(/[&<>"']/g, function (char) {
      return ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        "\"": "&quot;",
        "'": "&#39;"
      })[char];
    });
  }

  function normalizeValue(value) {
    if (value === null || value === undefined) {
      return "";
    }
    return String(value).toLowerCase();
  }

  function applyFilters() {
    var search = normalizeValue($("#rt-search").val());
    var fromFilter = normalizeValue($("#rt-filter-from").val());
    var toFilter = normalizeValue($("#rt-filter-to").val());
    var typeFilter = normalizeValue($("#rt-filter-type").val());
    var priorityFilter = normalizeValue($("#rt-filter-priority").val());
    var groupFilter = normalizeValue($("#rt-filter-group").val());
    var pageTypesFilter = normalizeValue($("#rt-filter-page-types").val());
    var userFilter = normalizeValue($("#rt-filter-user").val());
    var commentsFilter = normalizeValue($("#rt-filter-comments").val());
    var languagesFilter = normalizeValue($("#rt-filter-languages").val());

    state.filtered = state.rules.filter(function (rule) {
      if (fromFilter && normalizeValue(rule.fromUrl).indexOf(fromFilter) === -1) {
        return false;
      }
      if (toFilter && normalizeValue(rule.toUrl).indexOf(toFilter) === -1) {
        return false;
      }
      if (typeFilter && normalizeValue(rule.redirectType).indexOf(typeFilter) === -1) {
        return false;
      }
      if (priorityFilter && normalizeValue(rule.priority).indexOf(priorityFilter) === -1) {
        return false;
      }
      if (groupFilter && normalizeValue(rule.groupName).indexOf(groupFilter) === -1) {
        return false;
      }
      var pageTypeNamesValue = normalizeValue(rule.filterPageTypeNames);
      var pageTypeIdsValue = normalizeValue(rule.filterPageTypes);
      if (pageTypesFilter && pageTypeNamesValue.indexOf(pageTypesFilter) === -1 && pageTypeIdsValue.indexOf(pageTypesFilter) === -1) {
        return false;
      }
      if (userFilter && normalizeValue(rule.sitecoreUser).indexOf(userFilter) === -1) {
        return false;
      }
      if (commentsFilter && normalizeValue(rule.comments).indexOf(commentsFilter) === -1) {
        return false;
      }
      if (languagesFilter && normalizeValue(rule.languages).indexOf(languagesFilter) === -1) {
        return false;
      }
      if (search) {
        var composite = [
          rule.fromUrl,
          rule.toUrl,
          rule.redirectType,
          rule.priority,
          rule.groupName,
          rule.filterPageTypeNames,
          rule.filterPageTypes,
          rule.setupDate,
          rule.sitecoreUser,
          rule.comments,
          rule.languages
        ].join(" ");
        return normalizeValue(composite).indexOf(search) !== -1;
      }
      return true;
    });
  }

  function applySort() {
    var field = state.sortField;
    var dir = state.sortDir === "asc" ? 1 : -1;

    state.filtered.sort(function (a, b) {
      var left = a[field];
      var right = b[field];
      if (typeof left === "number") {
        left = isNaN(left) ? 0 : left;
        right = isNaN(right) ? 0 : right;
      } else if (typeof left === "string") {
        left = left.toLowerCase();
        right = (right || "").toLowerCase();
      }
      if (left === right) {
        return 0;
      }
      return left > right ? dir : -dir;
    });
  }

  function renderTable() {
    var $body = $("#rt-table-body");
    $body.empty();

    var pageSize = state.pageSize === "all" ? state.filtered.length : state.pageSize;
    var startIndex = (state.pageIndex - 1) * pageSize;
    var pageItems = state.filtered.slice(startIndex, startIndex + pageSize);

    var groups = [];
    var groupMap = {};
    pageItems.forEach(function (rule) {
      var groupName = rule.groupName || "Ungrouped";
      if (!groupMap[groupName]) {
        groupMap[groupName] = [];
        groups.push({ name: groupName, items: groupMap[groupName] });
      }
      groupMap[groupName].push(rule);
    });

    groups.forEach(function (group) {
      var groupName = group.name;
      var isCollapsed = state.collapsedGroups[groupName];
      var header = "<tr class=\"rt-group\" data-group=\"" + escapeHtml(groupName) + "\">" +
        "<td colspan=\"9\">" +
        "<span class=\"rt-group-toggle\">" + (isCollapsed ? "+" : "-") + "</span>" +
        "<span class=\"rt-group-name\">" + escapeHtml(groupName) + "</span>" +
        "<span class=\"rt-group-count\">(" + group.items.length + ")</span>" +
        "</td>" +
        "</tr>";
      $body.append(header);

      if (isCollapsed) {
        return;
      }

      group.items.forEach(function (rule) {
        var row = "<tr data-id=\"" + rule.id + "\">" +
          "<td>" + escapeHtml(rule.fromUrl) + "</td>" +
          "<td>" + escapeHtml(rule.toUrl) + "</td>" +
          "<td>" + escapeHtml(rule.redirectType) + "</td>" +
          "<td>" + escapeHtml(rule.priority) + "</td>" +
          "<td>" + escapeHtml(rule.filterPageTypeNames || "All") + "</td>" +
          "<td>" + escapeHtml(rule.setupDate) + "</td>" +
          "<td>" + escapeHtml(rule.sitecoreUser) + "</td>" +
          "<td>" + escapeHtml(rule.comments) + "</td>" +
          "<td>" + escapeHtml(rule.languages) + "</td>" +
          "</tr>";
        $body.append(row);
      });
    });

    highlightSelected();
    updatePagination();
  }

  function updatePagination() {
    var pageSize = state.pageSize === "all" ? state.filtered.length : state.pageSize;
    var totalPages = pageSize === 0 ? 1 : Math.ceil(state.filtered.length / pageSize);
    if (state.pageIndex > totalPages) {
      state.pageIndex = totalPages;
    }
    if (state.pageIndex < 1) {
      state.pageIndex = 1;
    }

    $("#rt-page-info").text("Page " + state.pageIndex + " of " + totalPages);
  }

  function refreshTable() {
    applyFilters();
    applySort();
    var pageSize = state.pageSize === "all" ? state.filtered.length : state.pageSize;
    var totalPages = pageSize === 0 ? 1 : Math.ceil(state.filtered.length / pageSize);
    if (state.pageIndex > totalPages) {
      state.pageIndex = totalPages;
    }
    if (state.pageIndex < 1) {
      state.pageIndex = 1;
    }
    renderTable();
  }

  function setStats(total, refreshedOn) {
    $("#rt-total").text(total);
    $("#rt-refreshed").text(refreshedOn || "-");
  }

  function refreshGroupList() {
    var groups = {};
    groups.Ungrouped = true;
    state.rules.forEach(function (rule) {
      var groupName = rule.groupName || "Ungrouped";
      groups[groupName] = true;
    });

    var $list = $("#rt-group-list");
    if ($list.length === 0) {
      return;
    }
    $list.empty();
    Object.keys(groups).sort(function (a, b) {
      return a.toLowerCase() > b.toLowerCase() ? 1 : -1;
    }).forEach(function (name) {
      $list.append("<option value=\"" + escapeHtml(name) + "\"></option>");
    });
  }

  function loadRules(options) {
    var config = options || {};
    var showMessages = config.showMessages !== false;
    setLoader(true);
    if (showMessages) {
      setMessage("");
    }
    $.getJSON(endpoints.list, { t: Date.now() })
      .done(function (data) {
        state.rules = data.items || [];
        setStats(data.total || 0, data.generatedOn);
        state.pageIndex = 1;
        refreshGroupList();
        refreshTable();
        if (config.onComplete) {
          config.onComplete(true);
        }
      })
      .fail(function () {
        if (showMessages) {
          setMessage("Failed to load redirect rules.", "error");
        }
        if (config.onComplete) {
          config.onComplete(false);
        }
      })
      .always(function () {
        setLoader(false);
      });
  }

  function parseTemplateIds(value) {
    if (!value) {
      return [];
    }
    return value.split("|").map(function (part) {
      return part.trim();
    }).filter(function (part) {
      return part.length > 0;
    });
  }

  function parseLanguages(value) {
    if (!value) {
      return [];
    }
    return value.split(/[|,]/).map(function (part) {
      return part.trim();
    }).filter(function (part) {
      return part.length > 0;
    });
  }

  function syncPickerSelection() {
    var selectedIds = parseTemplateIds($("#rt-edit-page-types").val());
    state.templatePicker.selected = {};
    selectedIds.forEach(function (id) {
      state.templatePicker.selected[id] = true;
    });
  }

  function openTemplatePicker() {
    syncPickerSelection();
    $("#rt-template-tree").empty();
    state.templatePicker.loaded = {};
    setPickerLoading(true);
    loadTemplateChildren(null, $("#rt-template-tree"), function () {
      setPickerLoading(false);
    });
    $("#rt-template-picker").addClass("is-active");
  }

  function closeTemplatePicker() {
    $("#rt-template-picker").removeClass("is-active");
  }

  function applyTemplatePicker() {
    var ids = Object.keys(state.templatePicker.selected);
    $("#rt-edit-page-types").val(ids.join("|"));
    closeTemplatePicker();
  }

  function clearTemplatePicker() {
    state.templatePicker.selected = {};
    $("#rt-edit-page-types").val("");
    $("#rt-template-tree input.rt-template-check").prop("checked", false);
  }

  function syncLanguagesPickerSelection() {
    var selectedCodes = parseLanguages($("#rt-edit-languages").val());
    state.languagesPicker.selected = {};
    selectedCodes.forEach(function (code) {
      state.languagesPicker.selected[code] = true;
    });
  }

  function renderLanguagesPicker() {
    var $list = $("#rt-languages-list");
    $list.empty();
    state.languagesPicker.options.forEach(function (code) {
      var $item = $("<div class=\"rt-language-option\"></div>");
      var $label = $("<label></label>");
      var $checkbox = $("<input type=\"checkbox\" class=\"rt-language-check\" />");
      $checkbox.attr("data-code", code);
      if (state.languagesPicker.selected[code]) {
        $checkbox.prop("checked", true);
      }
      $label.append($checkbox).append($("<span></span>").text(" " + code));
      $item.append($label);
      $list.append($item);
    });
  }

  function loadLanguages(callback) {
    if (state.languagesPicker.loaded) {
      if (callback) {
        callback(true);
      }
      return;
    }

    $.getJSON(endpoints.languages)
      .done(function (data) {
        var items = (data && data.items) ? data.items : [];
        state.languagesPicker.options = items.map(function (item) {
          if (typeof item === "string") {
            return item;
          }
          return item.code || item.name || "";
        }).filter(function (code) {
          return code && code.trim().length > 0;
        });
        state.languagesPicker.loaded = true;
        if (callback) {
          callback(true);
        }
      })
      .fail(function () {
        setMessage("Failed to load languages.", "error");
        if (callback) {
          callback(false);
        }
      });
  }

  function openLanguagesPicker() {
    loadLanguages(function (success) {
      if (!success) {
        return;
      }
      syncLanguagesPickerSelection();
      renderLanguagesPicker();
      $("#rt-languages-picker").addClass("is-active");
    });
  }

  function closeLanguagesPicker() {
    $("#rt-languages-picker").removeClass("is-active");
  }

  function applyLanguagesPicker() {
    var selectedCodes = state.languagesPicker.options.filter(function (code) {
      return state.languagesPicker.selected[code];
    });
    $("#rt-edit-languages").val(selectedCodes.join(","));
    closeLanguagesPicker();
  }

  function clearLanguagesPicker() {
    state.languagesPicker.selected = {};
    $("#rt-edit-languages").val("");
    $("#rt-languages-list input.rt-language-check").prop("checked", false);
  }

  function loadTemplateChildren(parentId, $container, callback) {
    var cacheKey = parentId || "root";
    if (state.templatePicker.loaded[cacheKey]) {
      $container.append(state.templatePicker.loaded[cacheKey]);
      if (callback) {
        callback();
      }
      return;
    }

    $.getJSON(endpoints.templateChildren, { id: parentId })
      .done(function (data) {
        var nodes = (data && data.items) ? data.items : [];
        var $list = $("<ul></ul>");

        nodes.forEach(function (node) {
          var $item = $("<li></li>");
          var $toggle = node.hasChildren ? $("<span class=\"rt-tree-toggle\">+</span>") : $("<span class=\"rt-tree-spacer\"></span>");
          var $node = $("<span class=\"rt-tree-node\"></span>");

          if (node.isTemplate) {
            var $checkbox = $("<input type=\"checkbox\" class=\"rt-template-check\" />");
            $checkbox.attr("data-id", node.id);
            if (state.templatePicker.selected[node.id]) {
              $checkbox.prop("checked", true);
            }
            $node.append($checkbox);
          }

          $node.append($("<span></span>").text(node.name));
          $item.append($toggle).append($node);

          if (node.hasChildren) {
            var $children = $("<div class=\"rt-tree-children\"></div>").hide();
            $item.append($children);
            $toggle.on("click", function () {
              if ($children.is(":visible")) {
                $children.hide();
                $toggle.text("+");
                return;
              }
              if ($children.children().length === 0) {
                loadTemplateChildren(node.id, $children, function () {
                  $children.show();
                  $toggle.text("-");
                });
              } else {
                $children.show();
                $toggle.text("-");
              }
            });
          }

          $list.append($item);
        });

        state.templatePicker.loaded[cacheKey] = $list;
        $container.append($list);
        if (callback) {
          callback();
        }
      })
      .fail(function () {
        setMessage("Failed to load template tree.", "error");
        if (callback) {
          callback();
        }
      });
  }

  function highlightSelected() {
    $("#rt-table-body tr").removeClass("selected");
    if (state.selectedId) {
      $("#rt-table-body tr[data-id=\"" + state.selectedId + "\"]").addClass("selected");
    }
  }

  function fillEditor(rule) {
    $("#rt-edit-from").val(rule ? rule.fromUrl : "");
    $("#rt-edit-to").val(rule ? rule.toUrl : "");
    $("#rt-edit-type").val(rule ? rule.redirectType : "");
    $("#rt-edit-comments").val(rule ? rule.comments : "");
    $("#rt-edit-priority").val(rule ? rule.priority : "0");
    $("#rt-edit-page-types").val(rule ? rule.filterPageTypes : "");
    $("#rt-edit-group").val(rule ? rule.groupName : "Ungrouped");
    $("#rt-edit-languages").val(rule ? rule.languages : "");
  }

  function clearSelection() {
    state.selectedId = null;
    fillEditor(null);
    highlightSelected();
  }

  function upsertRule() {
    var fromUrl = $("#rt-edit-from").val();
    var toUrl = $("#rt-edit-to").val();
    var redirectType = parseInt($("#rt-edit-type").val(), 10);
    var comments = $("#rt-edit-comments").val();
    var languages = ($("#rt-edit-languages").val() || "").trim();
    var priorityValue = $("#rt-edit-priority").val();
    var priority = priorityValue ? parseInt(priorityValue, 10) : 0;
    var filterPageTypes = ($("#rt-edit-page-types").val() || "").trim();
    var groupName = ($("#rt-edit-group").val() || "").trim();

    if (!fromUrl || !toUrl) {
      setMessage("From URL and To URL are required.", "error");
      return;
    }
    if (redirectType !== 301 && redirectType !== 302) {
      setMessage("Redirect type must be 301 or 302.", "error");
      return;
    }
    if (isNaN(priority) || priority < 0) {
      setMessage("Priority must be a non-negative number.", "error");
      return;
    }

    setLoader(true);
    $.post(endpoints.upsert, {
      fromUrl: fromUrl,
      toUrl: toUrl,
      redirectType: redirectType,
      comments: comments,
      languages: languages,
      priority: priority,
      filterPageTypes: filterPageTypes,
      groupName: groupName
    }).done(function (data) {
      if (data.error) {
        setMessage(data.error, "error");
        return;
      }
      setMessage(data.created ? "Rule added." : "Rule updated.", "success");
      clearSelection();
      loadRules();
    }).fail(function () {
      setMessage("Failed to save rule.", "error");
    }).always(function () {
      setLoader(false);
    });
  }

  function deleteRule() {
    if (!state.selectedId) {
      setMessage("Select a rule to delete.", "error");
      return;
    }

    if (!window.confirm("Delete selected rule?")) {
      return;
    }

    setLoader(true);
    $.post(endpoints.deleteRule, { id: state.selectedId })
      .done(function (data) {
        if (data.error) {
          setMessage(data.error, "error");
          return;
        }
        setMessage("Rule deleted.", "success");
        clearSelection();
        loadRules();
      })
      .fail(function () {
        setMessage("Failed to delete rule.", "error");
      })
      .always(function () {
        setLoader(false);
      });
  }

  function importCsv(file) {
    if (!file) {
      return;
    }
    var formData = new window.FormData();
    formData.append("file", file);
    setLoader(true);
    $.ajax({
      url: endpoints.importCsv,
      method: "POST",
      data: formData,
      processData: false,
      contentType: false
    }).done(function (data) {
      if (data.error) {
        setMessage(data.error, "error");
        return;
      }
      var lines = [
        "Import complete.",
        "Added: " + data.Added + ", Updated: " + data.Updated + ", Deleted: " + data.Deleted + ", Skipped: " + data.Skipped + "."
      ];
      if (data.Errors && data.Errors.length) {
        lines.push("Errors:");
        data.Errors.forEach(function (error) {
          lines.push("- " + error);
        });
      }
      var message = lines.join("\n");
      var messageType = data.Errors && data.Errors.length ? "error" : "success";
      loadRules({
        showMessages: false,
        onComplete: function (success) {
          if (!success) {
            message += "\nList refresh failed.";
            messageType = "error";
          }
          setMessage(message, messageType);
        }
      });
    }).fail(function () {
      setMessage("Import failed.", "error");
    }).always(function () {
      setLoader(false);
      $("#rt-import-file").val("");
    });
  }

  function exportCsv() {
    setLoader(true);
    fetch(endpoints.exportCsv, { credentials: "same-origin" })
      .then(function (response) {
        if (!response.ok) {
          throw new Error("Export failed");
        }
        var disposition = response.headers.get("content-disposition") || "";
        var fileNameMatch = disposition.match(/filename=\"?([^\";]+)\"?/i);
        var fileName = fileNameMatch ? fileNameMatch[1] : "redirect-rules.csv";
        return response.blob().then(function (blob) {
          var url = window.URL.createObjectURL(blob);
          var link = document.createElement("a");
          link.href = url;
          link.download = fileName;
          document.body.appendChild(link);
          link.click();
          link.remove();
          window.URL.revokeObjectURL(url);
        });
      })
      .then(function () {
        setMessage("Export complete.", "success");
      })
      .catch(function () {
        setMessage("Export failed.", "error");
      })
      .finally(function () {
        setLoader(false);
      });
  }

  function publishRules() {
    setLoader(true);
    $.post(endpoints.publish)
      .done(function (data) {
        if (data.error) {
          setMessage(data.error, "error");
          return;
        }
        setMessage("Publish started. Rules will refresh after publish finishes.", "success");
      })
      .fail(function () {
        setMessage("Publish failed.", "error");
      })
      .always(function () {
        setLoader(false);
      });
  }

  function testUrl() {
    var url = $("#rt-test-url").val();
    if (!url) {
      setMessage("Enter a URL to test.", "error");
      return;
    }
    setLoader(true);
    $.getJSON(endpoints.testUrl, { url: url })
      .done(function (data) {
        if (data.error) {
          setMessage(data.error, "error");
          return;
        }
        if (!data.matched) {
          $("#rt-test-result").text("No matching rule found.");
          return;
        }
        $("#rt-test-result").html(
          "Matched: <strong>" + escapeHtml(data.rule.fromUrl) + "</strong> -> " +
          "<strong>" + escapeHtml(data.rule.toUrl) + "</strong> (" + data.rule.redirectType + ")"
        );
      })
      .fail(function () {
        setMessage("URL test failed.", "error");
      })
      .always(function () {
        setLoader(false);
      });
  }

  function bindEvents() {
    $("#rt-refresh-btn").on("click", function () {
      loadRules();
    });
    $("#rt-import-btn").on("click", function () {
      $("#rt-import-file").click();
    });
    $("#rt-import-file").on("change", function (event) {
      var file = event.target.files[0];
      if (!file) {
        return;
      }
      var ok = window.confirm("Import redirect rules from \"" + file.name + "\"?");
      if (!ok) {
        $("#rt-import-file").val("");
        return;
      }
      importCsv(file);
    });
    $("#rt-export-btn").on("click", exportCsv);
    $("#rt-publish-btn").on("click", publishRules);
    $("#rt-save-btn").on("click", upsertRule);
    $("#rt-delete-btn").on("click", deleteRule);
    $("#rt-clear-btn").on("click", clearSelection);
    $("#rt-test-btn").on("click", testUrl);
    $("#rt-pick-page-types").on("click", openTemplatePicker);
    $("#rt-picker-close").on("click", closeTemplatePicker);
    $("#rt-picker-apply").on("click", applyTemplatePicker);
    $("#rt-picker-clear").on("click", clearTemplatePicker);
    $("#rt-pick-languages").on("click", openLanguagesPicker);
    $("#rt-languages-picker-close").on("click", closeLanguagesPicker);
    $("#rt-languages-picker-apply").on("click", applyLanguagesPicker);
    $("#rt-languages-picker-clear").on("click", clearLanguagesPicker);

    $("#rt-template-tree").on("change", ".rt-template-check", function () {
      var id = $(this).data("id");
      if (!id) {
        return;
      }
      if ($(this).is(":checked")) {
        state.templatePicker.selected[id] = true;
      } else {
        delete state.templatePicker.selected[id];
      }
    });

    $("#rt-languages-list").on("change", ".rt-language-check", function () {
      var code = $(this).data("code");
      if (!code) {
        return;
      }
      if ($(this).is(":checked")) {
        state.languagesPicker.selected[code] = true;
      } else {
        delete state.languagesPicker.selected[code];
      }
    });

    $("#rt-page-size").on("change", function () {
      var value = $(this).val();
      state.pageSize = value === "all" ? "all" : parseInt(value, 10);
      state.pageIndex = 1;
      refreshTable();
    });

    $("#rt-prev").on("click", function () {
      state.pageIndex -= 1;
      refreshTable();
    });
    $("#rt-next").on("click", function () {
      state.pageIndex += 1;
      refreshTable();
    });

    $("#rt-table-body").on("click", "tr.rt-group", function () {
      var groupName = $(this).data("group");
      state.collapsedGroups[groupName] = !state.collapsedGroups[groupName];
      renderTable();
    });

    $("#rt-table-body").on("click", "tr", function () {
      if ($(this).hasClass("rt-group")) {
        return;
      }
      var id = $(this).data("id");
      var rule = state.rules.filter(function (item) { return item.id === id; })[0];
      if (!rule) {
        return;
      }
      state.selectedId = id;
      fillEditor(rule);
      highlightSelected();
    });

    $(".rt-filters input").on("input", function () {
      state.pageIndex = 1;
      refreshTable();
    });

    $("#rt-table thead").on("click", "th", function () {
      var field = $(this).data("sort");
      if (!field) {
        return;
      }
      if (state.sortField === field) {
        state.sortDir = state.sortDir === "asc" ? "desc" : "asc";
      } else {
        state.sortField = field;
        state.sortDir = "asc";
      }
      refreshTable();
    });
  }

  $(function () {
    bindEvents();
    loadRules();
  });
})();
