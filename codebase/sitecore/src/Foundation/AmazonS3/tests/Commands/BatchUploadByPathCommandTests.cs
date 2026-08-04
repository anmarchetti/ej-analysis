using easyJet.Foundation.AmazonS3.Commands;
using FluentAssertions;
using Sitecore.Configuration;
using Sitecore.Data;
using Sitecore.Data.Items;
using Sitecore.NSubstituteUtils;
using Sitecore.Shell.Framework.Commands;
using Sitecore.Web.UI.Sheer;
using Xunit;

namespace easyJet.Foundation.AmazonS3.Tests.Commands
{
    public class BatchUploadByPathCommandTests
    {
        [Fact]
        public void Execute_ShouldOpenCustomDialog_WhenItemPathMatchesConfiguredPath()
        {
            // Arrange
            var targetPath = "/sitecore/media library/Bulk Image Import";
            var customDialogUrl = "/sitecore/shell/Applications/Media/UploadManager/EasyJetBulkUpload.aspx";
            var item = new FakeItem(ID.NewID).WithPath(targetPath).ToSitecoreItem();
            var context = new CommandContext(item);
            var sut = new BatchUploadByPathCommandProxy();

            using (new SettingsSwitcher(Constants.Settings.SitecoreImagesPathSettingsName, targetPath))
            using (new SettingsSwitcher(Constants.Settings.BatchUploadCustomDialogUrlSettingsName, customDialogUrl))
            {
                // Act
                sut.Execute(context);
            }

            // Assert
            sut.ExecutedBase.Should().BeFalse();
            sut.StartedCustomBatchUpload.Should().BeTrue();
        }

        [Fact]
        public void Execute_ShouldFallbackToBase_WhenItemPathDoesNotMatchConfiguredPath()
        {
            // Arrange
            var targetPath = "/sitecore/media library/Bulk Image Import";
            var item = new FakeItem(ID.NewID).WithPath("/sitecore/media library/Other").ToSitecoreItem();
            var context = new CommandContext(item);
            var sut = new BatchUploadByPathCommandProxy();

            using (new SettingsSwitcher(Constants.Settings.SitecoreImagesPathSettingsName, targetPath))
            using (new SettingsSwitcher(Constants.Settings.BatchUploadCustomDialogUrlSettingsName, "/sitecore/shell/Applications/Media/UploadManager/EasyJetBulkUpload.aspx"))
            {
                // Act
                sut.Execute(context);
            }

            // Assert
            sut.ExecutedBase.Should().BeTrue();
            sut.StartedCustomBatchUpload.Should().BeFalse();
        }

        [Fact]
        public void Execute_ShouldFallbackToBase_WhenNoTargetItem()
        {
            // Arrange
            var context = new CommandContext();
            var sut = new BatchUploadByPathCommandProxy();

            // Act
            sut.Execute(context);

            // Assert
            sut.ExecutedBase.Should().BeTrue();
            sut.StartedCustomBatchUpload.Should().BeFalse();
        }

        [Fact]
        public void QueryState_ShouldReturnHidden_WhenNoTargetItem()
        {
            // Arrange
            var sut = new BatchUploadByPathCommandProxy();

            // Act
            var state = sut.QueryState(new CommandContext());

            // Assert
            state.Should().Be(CommandState.Hidden);
        }

        [Fact]
        public void RunCustomBatchUpload_ShouldShowAlert_WhenItemCannotBeResolved()
        {
            // Arrange
            var sut = new BatchUploadByPathCommandProxy
            {
                ResolvedItem = null
            };
            var args = new ClientPipelineArgs();
            args.Parameters["id"] = ID.NewID.ToString();
            args.Parameters["language"] = "en";
            args.Parameters["version"] = "1";

            // Act
            sut.RunCustomBatchUploadProxy(args);

            // Assert
            sut.ItemNotFoundAlertShown.Should().BeTrue();
            sut.ShownDialogUrl.Should().BeNull();
        }

        [Fact]
        public void RunCustomBatchUpload_ShouldShowDialog_WhenItemIsResolved_AndRequestIsInitial()
        {
            // Arrange
            var item = new FakeItem(ID.NewID).WithPath("/sitecore/media library/Bulk Image Import").WithUri().ToSitecoreItem();
            var sut = new BatchUploadByPathCommandProxy
            {
                ResolvedItem = item,
                CustomDialogUrl = "/sitecore/shell/Applications/Media/UploadManager/EasyJetBulkUpload.aspx"
            };

            var args = new ClientPipelineArgs();
            args.Parameters["id"] = item.ID.ToString();
            args.Parameters["language"] = item.Language.Name;
            args.Parameters["version"] = item.Version.Number.ToString();

            // Act
            sut.RunCustomBatchUploadProxy(args);

            // Assert
            sut.ShownDialogUrl.Should().StartWith(sut.CustomDialogUrl);
            sut.ItemNotFoundAlertShown.Should().BeFalse();
        }

        [Fact]
        public void RunCustomBatchUpload_ShouldSendRefreshMessages_WhenPostBack()
        {
            // Arrange
            var item = new FakeItem(ID.NewID).WithPath("/sitecore/media library/Bulk Image Import").ToSitecoreItem();
            var sut = new BatchUploadByPathCommandProxy
            {
                ResolvedItem = item
            };

            var args = new ClientPipelineArgs
            {
                IsPostBack = true
            };
            args.Parameters["id"] = item.ID.ToString();
            args.Parameters["language"] = item.Language.Name;
            args.Parameters["version"] = item.Version.Number.ToString();

            // Act
            sut.RunCustomBatchUploadProxy(args);

            // Assert
            sut.RefreshMessagesSent.Should().BeTrue();
            sut.ShownDialogUrl.Should().BeNull();
        }

        private class BatchUploadByPathCommandProxy : BatchUploadByPathCommand
        {
            public bool ExecutedBase { get; private set; }

            public bool StartedCustomBatchUpload { get; private set; }

            public bool ItemNotFoundAlertShown { get; private set; }

            public bool RefreshMessagesSent { get; private set; }

            public Item ResolvedItem { get; set; }

            public string CustomDialogUrl { get; set; } = Constants.Dialogs.DefaultUploadDialogUrl;

            public string ShownDialogUrl { get; private set; }

            public void RunCustomBatchUploadProxy(ClientPipelineArgs args)
            {
                RunCustomBatchUpload(args);
            }

            protected override void ExecuteBase(CommandContext context)
            {
                ExecutedBase = true;
            }

            protected override void StartCustomBatchUpload(Item targetItem)
            {
                StartedCustomBatchUpload = true;
            }

            protected override Item ResolveItemFromArgs(string itemId, string languageName, string versionValue)
            {
                return ResolvedItem;
            }

            protected override void ShowItemNotFoundAlert()
            {
                ItemNotFoundAlertShown = true;
            }

            protected override void SendRefreshMessages(string itemId)
            {
                RefreshMessagesSent = true;
            }

            protected override string GetCustomDialogUrl()
            {
                return CustomDialogUrl;
            }

            protected override void ShowDialog(string url)
            {
                ShownDialogUrl = url;
            }
        }
    }
}
