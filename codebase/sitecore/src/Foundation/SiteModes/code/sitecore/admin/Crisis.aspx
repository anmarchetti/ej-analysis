<%@ Page Language="C#" AutoEventWireup="true" CodeBehind="Crisis.aspx.cs" Inherits="easyJet.Foundation.SiteModes.sitecore.admin.Crisis" %>

<!DOCTYPE html>

<html lang="en" xmlns="http://www.w3.org/1999/xhtml">
<head runat="server">
    <title>Crisis</title>
    <link href="assets/crisis.css" rel="stylesheet" />
</head>
<body>
    <header id="HeaderTag" runat="server">
    </header>

    <div class="columns">
        <div class="column big-column">
            <h1 id="SelectingLanguageTitle" runat="server"></h1>
            <p id="SelectingLanguageDescription" runat="server"></p>

            <form id="LanguagesForm" runat="server">
                <div class="languages-checkboxes-container">
                    <asp:Repeater ID="LanguagesCheckers" runat="server" OnItemDataBound="BindCheckboxData">
                        <ItemTemplate>
                            <div class="language-checkbox">
                                <asp:CheckBox runat="server" ID="LanguageCheckbox" />
                            </div>
                        </ItemTemplate>
                    </asp:Repeater>
                </div>

                <asp:Button CommandArgument="master" ID="PublishToStagingButton" runat="server" Text="Publish to Staging" OnClick="PublishToDatabase" />

                <div id="confirm-checkbox-container">
                    <asp:CheckBox ID="ConfirmChangesCheckBox" runat="server" Enabled="False"/>
                </div>

                <asp:Button CommandArgument="web" ID="PublishToLiveButton" runat="server" Text="Publish to Live" OnClick="PublishToDatabase" Enabled="false" />

            </form>
        </div>
        <div class="column small-column">
            <h1 id="StagingTitle" runat="server"></h1>
            <p id="StagingDescription" runat="server"></p>

            <% if (StagingLinks.Items.Count > 0)
                {%>
            <ul>
                <asp:Repeater runat="server" ID="StagingLinks" OnItemDataBound="BindHyperLinkData">
                    <ItemTemplate>
                        <li><asp:HyperLink ID="Link" runat="server"/></li>
                    </ItemTemplate>
                </asp:Repeater>
            </ul>
            <% }
                else
                { %>
            <p id="SelectedLanguagesStatusTextStaging" runat="server"></p>
            <% } %>
        </div>
        <div class="column small-column">
            <h1 id="LiveTitle" runat="server"></h1>
            <p id="LiveDescription" runat="server"></p>

            <% if (LiveLinks.Items.Count > 0)
                { %>
            <ul>
                <asp:Repeater runat="server" ID="LiveLinks" OnItemDataBound="BindHyperLinkData">
                    <ItemTemplate>
                        <li><asp:HyperLink ID="Link" runat="server"/></li>
                    </ItemTemplate>
                </asp:Repeater>
            </ul>
            <% }
                else
                { %>
            <p id="SelectedLanguagesStatusTextLive" runat="server"></p>
            <% } %>
        </div>
    </div>

    <script src="assets/crisis.js"></script>
</body>
</html>
