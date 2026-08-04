using System;
using System.IO;
using System.Web;
using System.Web.UI.HtmlControls;
using easyJet.Foundation.AmazonS3.sitecore.shell.Applications.Media.UploadManager;
using FluentAssertions;
using Xunit;

namespace easyJet.Foundation.AmazonS3.Tests.Pages
{
    public class EasyJetUploadManagerTests
    {
        [Fact]
        public void BuildFrameSource_ShouldReturnExpectedUrl()
        {
            // Arrange
            const string queryString = "id=123";

            // Act
            var uploadSource = EasyJetUploadManagerProxy.BuildFrameSourceProxy(Constants.Dialogs.CustomUploadDialogUrl, queryString);
            var resultSource = EasyJetUploadManagerProxy.BuildFrameSourceProxy(Constants.Dialogs.UploadResultDialogUrl, queryString);

            // Assert
            uploadSource.Should().Be($"{Constants.Dialogs.CustomUploadDialogUrl}?{queryString}");
            resultSource.Should().Be($"{Constants.Dialogs.UploadResultDialogUrl}?{queryString}");
        }

        [Fact]
        public void SetFrameSource_ShouldSetSrc_WhenFrameExists()
        {
            // Arrange
            var frame = new HtmlGenericControl("iframe");

            // Act
            EasyJetUploadManagerProxy.SetFrameSourceProxy(frame, Constants.Dialogs.CustomUploadDialogUrl, "x=1");

            // Assert
            frame.Attributes["src"].Should().Be($"{Constants.Dialogs.CustomUploadDialogUrl}?x=1");
        }

        [Fact]
        public void SetFrameSource_ShouldNotThrow_WhenFrameIsNull()
        {
            // Act
            var action = new System.Action(() => EasyJetUploadManagerProxy.SetFrameSourceProxy(null, Constants.Dialogs.CustomUploadDialogUrl, "x=1"));

            // Assert
            action.Should().NotThrow();
        }

        [Fact]
        public void OnLoad_ShouldSetFrameSources_WhenControlsExist()
        {
            // Arrange
            EnsureHttpContext();
            var sut = new EasyJetUploadManagerOnLoadProxy("x=1");
            var uploadFrame = new HtmlGenericControl("iframe") { ID = "Upload" };
            var resultFrame = new HtmlGenericControl("iframe") { ID = "Result" };
            sut.Controls.Add(uploadFrame);
            sut.Controls.Add(resultFrame);

            // Act
            sut.OnLoadProxy(EventArgs.Empty);

            // Assert
            uploadFrame.Attributes["src"].Should().Be($"{Constants.Dialogs.CustomUploadDialogUrl}?x=1");
            resultFrame.Attributes["src"].Should().Be($"{Constants.Dialogs.UploadResultDialogUrl}?x=1");
        }

        [Fact]
        public void OnLoad_ShouldNotThrow_WhenControlsMissing()
        {
            // Arrange
            EnsureHttpContext();
            var sut = new EasyJetUploadManagerOnLoadProxy(string.Empty);

            // Act
            var action = new Action(() => sut.OnLoadProxy(EventArgs.Empty));

            // Assert
            action.Should().NotThrow();
        }

        private static void EnsureHttpContext()
        {
            if (HttpContext.Current != null)
            {
                return;
            }

            var request = new HttpRequest(string.Empty, "http://localhost/", string.Empty);
            var response = new HttpResponse(new StringWriter());
            HttpContext.Current = new HttpContext(request, response);
        }

        private class EasyJetUploadManagerProxy : EasyJetUploadManager
        {
            public static string BuildFrameSourceProxy(string baseUrl, string queryString)
            {
                return BuildFrameSource(baseUrl, queryString);
            }

            public static void SetFrameSourceProxy(HtmlGenericControl frame, string baseUrl, string queryString)
            {
                SetFrameSource(frame, baseUrl, queryString);
            }
        }

        private class EasyJetUploadManagerOnLoadProxy : EasyJetUploadManager
        {
            private readonly string queryString;

            public EasyJetUploadManagerOnLoadProxy(string queryString)
            {
                this.queryString = queryString;
            }

            public void OnLoadProxy(EventArgs args)
            {
                OnLoad(args);
            }

            protected override void EnsureLoggedIn()
            {
                // Ignore authentication check for unit test context.
            }

            protected override string GetQueryString()
            {
                return queryString;
            }
        }
    }
}
