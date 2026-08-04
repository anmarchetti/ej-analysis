<%@ Page Language="C#" AutoEventWireup="true" %>
<%@ Register TagPrefix="sc" Namespace="Sitecore.Web.UI.HtmlControls" Assembly="Sitecore.Kernel" %>
<%@ Register Src="~/sitecore/shell/Applications/GlobalHeader.ascx" TagName="GlobalHeader" TagPrefix="uc" %>

<!DOCTYPE html>
<html lang="en">
<head runat="server">
  <title>Redirect Tool</title>
  <sc:Stylesheet runat="server" Src="Content Manager.css" DeviceDependant="true" />
  <link rel="stylesheet" href="/sitecore/shell/Applications/RedirectTool/redirect-tool.css?v=1.1" />
  <script type="text/javascript" src="/sitecore/shell/controls/lib/jquery/jquery-1.12.4.min.js"></script>
  <script type="text/javascript" src="/sitecore/shell/Applications/RedirectTool/redirect-tool.js?v=1.1"></script>
</head>
<body class="scWindowBorder1">
  <form id="RedirectToolForm" runat="server">
    <uc:GlobalHeader runat="server" />
    <div class="rt-shell">
      <div class="rt-header">
        <div class="rt-title">Redirect Tool</div>
        <div class="rt-stats">
          <div>Total rules: <span id="rt-total">0</span></div>
          <div>Last refresh: <span id="rt-refreshed">-</span></div>
        </div>
      </div>

      <div class="rt-actions">
        <button type="button" id="rt-import-btn">Import CSV</button>
        <button type="button" id="rt-export-btn">Export CSV</button>
        <button type="button" id="rt-publish-btn">Publish Rules</button>
        <button type="button" id="rt-refresh-btn">Refresh</button>
        <input type="file" id="rt-import-file" accept=".csv" />
      </div>

      <div class="rt-filters">
        <input type="text" id="rt-search" placeholder="Search all columns" />
        <input type="text" id="rt-filter-from" placeholder="From URL" />
        <input type="text" id="rt-filter-to" placeholder="To URL" />
        <input type="text" id="rt-filter-type" placeholder="301 or 302" />
        <input type="text" id="rt-filter-priority" placeholder="Priority" />
        <input type="text" id="rt-filter-group" placeholder="Group" list="rt-group-list" />
        <input type="text" id="rt-filter-page-types" placeholder="Page Types" />
        <input type="text" id="rt-filter-user" placeholder="Sitecore User" />
        <input type="text" id="rt-filter-comments" placeholder="Comments" />
        <input type="text" id="rt-filter-languages" placeholder="Languages" />
        <select id="rt-page-size">
          <option value="10">10</option>
          <option value="20" selected="selected">20</option>
          <option value="50">50</option>
          <option value="100">100</option>
          <option value="all">All</option>
        </select>
      </div>
      <datalist id="rt-group-list"></datalist>

      <div class="rt-table">
        <table>
          <thead>
            <tr>
              <th data-sort="fromUrl">From URL</th>
              <th data-sort="toUrl">To URL</th>
              <th data-sort="redirectType">Type</th>
              <th data-sort="priority">Priority</th>
              <th data-sort="filterPageTypes">Page Types</th>
              <th data-sort="setupDate">Setup Date</th>
              <th data-sort="sitecoreUser">User</th>
              <th data-sort="comments">Comments</th>
              <th data-sort="languages">Languages</th>
            </tr>
          </thead>
          <tbody id="rt-table-body"></tbody>
        </table>
      </div>

      <div class="rt-pagination">
        <button type="button" id="rt-prev">Prev</button>
        <span id="rt-page-info">Page 1</span>
        <button type="button" id="rt-next">Next</button>
      </div>

      <div class="rt-editor">
        <div class="rt-section-title">Add or Update Rule</div>
        <div class="rt-editor-row">
          <label for="rt-edit-from">From URL</label>
          <input type="text" id="rt-edit-from" />
        </div>
        <div class="rt-editor-row">
          <label for="rt-edit-to">To URL</label>
          <input type="text" id="rt-edit-to" />
        </div>
        <div class="rt-editor-row">
          <label for="rt-edit-type">Redirect Type</label>
          <select id="rt-edit-type">
            <option value="">Select</option>
            <option value="301">301</option>
            <option value="302">302</option>
          </select>
        </div>
        <div class="rt-editor-row">
          <label for="rt-edit-priority">Priority</label>
          <input type="number" id="rt-edit-priority" min="0" value="0" />
        </div>
        <div class="rt-editor-row">
          <label for="rt-edit-group">Group</label>
          <input type="text" id="rt-edit-group" list="rt-group-list" placeholder="Ungrouped" />
        </div>
        <div class="rt-editor-row">
          <label for="rt-edit-page-types">Filter Page Types</label>
          <div class="rt-picker-field">
            <input type="text" id="rt-edit-page-types" placeholder="Template IDs separated by |" />
            <button type="button" id="rt-pick-page-types">Pick</button>
          </div>
        </div>
        <div class="rt-editor-row">
          <label for="rt-edit-comments">Comments</label>
          <textarea id="rt-edit-comments"></textarea>
        </div>
        <div class="rt-editor-row">
          <label for="rt-edit-languages">Languages</label>
          <div class="rt-picker-field">
            <input type="text" id="rt-edit-languages" placeholder="Comma-separated language codes" />
            <button type="button" id="rt-pick-languages">Pick</button>
          </div>
        </div>
        <div class="rt-editor-actions">
          <button type="button" id="rt-save-btn">Save</button>
          <button type="button" id="rt-delete-btn">Delete Selected</button>
          <button type="button" id="rt-clear-btn">Clear</button>
          <span class="rt-help">Tip: supports exact paths, wildcards (*, ?), and regex (e.g. ^/destinations(.*)$).</span>
        </div>
      </div>

      <div class="rt-test">
        <div class="rt-section-title">Test URL</div>
        <div class="rt-test-row">
          <input type="text" id="rt-test-url" placeholder="Enter a URL to test" />
          <button type="button" id="rt-test-btn">Test</button>
        </div>
        <div id="rt-test-result" class="rt-test-result"></div>
      </div>

      <div id="rt-message" class="rt-message"></div>
    </div>

    <div id="rt-loader" class="rt-loader">
      <div class="rt-loader-inner">Working...</div>
    </div>

    <div id="rt-template-picker" class="rt-picker">
      <div class="rt-picker-panel">
        <div class="rt-picker-header">
          <div class="rt-picker-title">Select Page Types</div>
          <button type="button" id="rt-picker-close">Close</button>
        </div>
        <div class="rt-picker-body">
          <div id="rt-template-loading" class="rt-picker-loading">Loading...</div>
          <div id="rt-template-tree" class="rt-picker-tree"></div>
        </div>
        <div class="rt-picker-actions">
          <button type="button" id="rt-picker-apply">Apply</button>
          <button type="button" id="rt-picker-clear">Clear</button>
        </div>
      </div>
    </div>

    <div id="rt-languages-picker" class="rt-picker">
      <div class="rt-picker-panel">
        <div class="rt-picker-header">
          <div class="rt-picker-title">Select Languages</div>
          <button type="button" id="rt-languages-picker-close">Close</button>
        </div>
        <div class="rt-picker-body">
          <div id="rt-languages-list" class="rt-picker-tree"></div>
        </div>
        <div class="rt-picker-actions">
          <button type="button" id="rt-languages-picker-apply">Apply</button>
          <button type="button" id="rt-languages-picker-clear">Clear</button>
        </div>
      </div>
    </div>
  </form>
</body>
</html>