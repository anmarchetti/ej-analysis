using System;
using System.IO;
using System.Web;
using System.Web.UI.HtmlControls;
using easyJet.Foundation.AmazonS3.sitecore.shell.Applications.Media.UploadManager;
using FluentAssertions;
using Xunit;

namespace easyJet.Foundation.AmazonS3.Tests.Pages
{
    public class EasyJetBulkUploadTests
    {
        [Fact]
        public void ApplyKeepOriginalCheckboxState_ShouldCheckCheckbox_WhenKeepOriginalEnabled()
        {
            // Arrange
            var checkbox = new HtmlInputCheckBox { Checked = false };

            // Act
            EasyJetBulkUploadProxy.ApplyKeepOriginalCheckboxStateProxy(checkbox, true);

            // Assert
            checkbox.Checked.Should().BeTrue();
        }

        [Fact]
        public void ApplyKeepOriginalCheckboxState_ShouldUncheckCheckbox_WhenKeepOriginalDisabled()
        {
            // Arrange
            var checkbox = new HtmlInputCheckBox { Checked = true };

            // Act
            EasyJetBulkUploadProxy.ApplyKeepOriginalCheckboxStateProxy(checkbox, false);

            // Assert
            checkbox.Checked.Should().BeFalse();
        }

        [Fact]
        public void ApplyKeepOriginalCheckboxState_ShouldNotThrow_WhenCheckboxMissing()
        {
            // Act
            Action action = () => EasyJetBulkUploadProxy.ApplyKeepOriginalCheckboxStateProxy(null, true);

            // Assert
            action.Should().NotThrow();
        }

        [Fact]
        public void ParseKeepOriginalValue_ShouldReturnTrue_WhenRawValueIsOne()
        {
            // Act
            var result = EasyJetBulkUploadProxy.ParseKeepOriginalValueProxy("1");

            // Assert
            result.Should().BeTrue();
        }

        [Fact]
        public void ParseKeepOriginalValue_ShouldReturnFalse_WhenRawValueIsNull()
        {
            // Act
            var result = EasyJetBulkUploadProxy.ParseKeepOriginalValueProxy(null);

            // Assert
            result.Should().BeFalse();
        }

        [Theory]
        [InlineData("0")]
        [InlineData("false")]
        [InlineData("")]
        public void ParseKeepOriginalValue_ShouldReturnFalse_WhenRawValueIsFalseLike(string rawValue)
        {
            // Act
            var result = EasyJetBulkUploadProxy.ParseKeepOriginalValueProxy(rawValue);

            // Assert
            result.Should().BeFalse();
        }

        [Fact]
        public void OnLoad_ShouldApplyCheckboxState_WhenCheckboxExists()
        {
            // Arrange
            EnsureHttpContext();
            var sut = new EasyJetBulkUploadOnLoadProxy
            {
                KeepOriginalEnabled = true
            };
            var checkbox = new HtmlInputCheckBox
            {
                ID = Constants.Dialogs.KeepOriginalCheckboxName,
                Checked = false
            };
            sut.Controls.Add(checkbox);

            // Act
            sut.OnLoadProxy(EventArgs.Empty);

            // Assert
            checkbox.Checked.Should().BeTrue();
        }

        [Fact]
        public void OnLoad_ShouldNotThrow_WhenCheckboxMissing()
        {
            // Arrange
            EnsureHttpContext();
            var sut = new EasyJetBulkUploadOnLoadProxy();

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

        private class EasyJetBulkUploadProxy : EasyJetBulkUpload
        {
            public static void ApplyKeepOriginalCheckboxStateProxy(HtmlInputCheckBox checkbox, bool isKeepOriginalEnabled)
            {
                ApplyKeepOriginalCheckboxState(checkbox, isKeepOriginalEnabled);
            }

            public static bool ParseKeepOriginalValueProxy(string rawValue)
            {
                return ParseKeepOriginalValue(rawValue);
            }
        }

        private class EasyJetBulkUploadOnLoadProxy : EasyJetBulkUpload
        {
            public bool KeepOriginalEnabled { get; set; }

            public void OnLoadProxy(EventArgs args)
            {
                OnLoad(args);
            }

            protected override bool GetKeepOriginalEnabled()
            {
                return KeepOriginalEnabled;
            }
        }
    }
}
