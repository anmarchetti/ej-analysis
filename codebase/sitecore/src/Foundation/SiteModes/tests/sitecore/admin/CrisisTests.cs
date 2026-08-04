using System;
using System.Web.UI.WebControls;
using AutoFixture;
using AutoFixture.Xunit2;
using easyJet.Foundation.SiteModes.Models.Domain;
using easyJet.Foundation.SiteModes.sitecore.admin;
using FluentAssertions;
using NSubstitute;
using Sitecore.FakeDb;
using Xunit;

namespace easyJet.Foundation.SiteModes.Tests.sitecore.admin
{
    public class CrisisTests : Crisis
    {
        private readonly Fixture fixture;
        private readonly Db db;

        public CrisisTests()
        {
            fixture = new Fixture();
            db = fixture.Freeze<Db>();
        }

        [Fact]
        public void OnInit_ShouldThrowException_IfArgsNull()
        {
            // Act
            Action actual = () => OnInit(null);

            // Assert
            actual.Should().Throw<ArgumentNullException>();
        }

        [Fact]
        public void OnInit_ShouldNotThrowException_IfArgsNotNull()
        {
            // Arrange
            var args = new EventArgs();

            // Act
            Action actual = () => OnInit(args);

            // Assert
            actual.Should().NotThrow<ArgumentNullException>();
        }

        [Fact]
        public void OnInit_ShouldCallCheckSecurity_IfRoleSettingNotExist()
        {
            // Arrange
            var args = new EventArgs();

            // Act
            var user = Substitute.For<Sitecore.Security.Accounts.User>(@"fakeDomain\fakeUser", true);
            user.IsAdministrator.Returns(true);

            using (new Sitecore.Security.Accounts.UserSwitcher(user))
            {
                OnInit(args);
            }

            // Assert
            var actual = user.Received().IsAdministrator;
        }

        [Fact]
        public void BindCheckboxData_ShouldSetValuesToCheckBox_IfRepeaterDataItemNotNull()
        {
            var settingsItem = fixture.Build<DbItem>().Without(x => x.ParentID).Create();
            settingsItem.AddVersion("en");

            db.Add(settingsItem);

            var checkBoxId = "LanguageCheckbox";
            RepeaterItem repeaterItem = new RepeaterItem(0, ListItemType.Item);

            CheckBox checkBoxControl = new CheckBox();
            checkBoxControl.ID = checkBoxId;

            repeaterItem.Controls.Add(checkBoxControl);

            repeaterItem.DataItem = new LanguageVersionState(db.GetItem(settingsItem.ID));

            RepeaterItemEventArgs args = new RepeaterItemEventArgs(repeaterItem);

            // Act
            BindCheckboxData(new object(), args);

            // Assert
            checkBoxControl.Text.Should().Be("English");
            checkBoxControl.Attributes["value"].Should().Be("en");
        }

        [Fact]
        public void BindCheckboxData_ShouldNotSetValuesToCheckBox_IfRepeaterDataItemTypeNotItem()
        {
            var checkBoxId = "LanguageCheckbox";
            RepeaterItem repeaterItem = new RepeaterItem(0, ListItemType.EditItem);

            CheckBox checkBoxControl = new CheckBox();
            checkBoxControl.ID = checkBoxId;

            repeaterItem.Controls.Add(checkBoxControl);

            RepeaterItemEventArgs args = new RepeaterItemEventArgs(repeaterItem);

            // Act
            BindCheckboxData(new object(), args);

            // Assert
            checkBoxControl.Text.Should().BeEmpty();
            checkBoxControl.Attributes["value"].Should().BeNull();
        }

        [Theory]
        [AutoData]
        public void BindHyperLinkData_ShouldSetValuesToCheckBox_IfRepeaterDataItemNotNull(Link link)
        {
            // Arrange
            var linkId = "Link";
            RepeaterItem repeaterItem = new RepeaterItem(0, ListItemType.Item);

            HyperLink hyperLinkControl = new HyperLink();
            hyperLinkControl.ID = linkId;

            repeaterItem.Controls.Add(hyperLinkControl);

            repeaterItem.DataItem = link;

            RepeaterItemEventArgs args = new RepeaterItemEventArgs(repeaterItem);

            // Act
            BindHyperLinkData(new object(), args);

            // Assert
            hyperLinkControl.Text.Should().Be(link.UrlText);
            hyperLinkControl.NavigateUrl.Should().Be(link.Url);
        }

        [Fact]
        public void BindHyperLinkData_ShouldNotSetValuesToCheckBox_IfRepeaterDataItemTypeNotItem()
        {
            // Arrange
            var linkId = "Link";
            RepeaterItem repeaterItem = new RepeaterItem(0, ListItemType.EditItem);

            HyperLink hyperLinkControl = new HyperLink();
            hyperLinkControl.ID = linkId;

            repeaterItem.Controls.Add(hyperLinkControl);

            RepeaterItemEventArgs args = new RepeaterItemEventArgs(repeaterItem);

            // Act
            BindHyperLinkData(new object(), args);

            // Assert
            hyperLinkControl.Text.Should().BeEmpty();
            hyperLinkControl.NavigateUrl.Should().BeEmpty();
        }
    }
}
