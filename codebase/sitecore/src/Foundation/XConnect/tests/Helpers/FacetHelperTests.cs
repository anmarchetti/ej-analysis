using System.Collections.Generic;
using AutoFixture.Xunit2;
using easyJet.Foundation.XConnect.Common.Helpers;
using easyJet.Foundation.XConnect.Common.Model;
using FluentAssertions;
using NSubstitute;
using Sitecore.XConnect;
using Sitecore.XConnect.Collection.Model;
using Sitecore.XConnect.Serialization;
using Xunit;

namespace easyJet.Foundation.XConnect.Common.Tests.Helpers
{
    public class FacetHelperTests
    {
        public static IEnumerable<object[]> InvalidPersonalInfo()
        {
            yield return new object[] { new ContactPersonalInfoData(null, null, null) };
            yield return new object[] { new ContactPersonalInfoData(string.Empty, null, null) };
            yield return new object[] { new ContactPersonalInfoData("  ", string.Empty, null) };
        }

        public static IEnumerable<object[]> InvalidPhoneData()
        {
            yield return new object[] { new ContactPhoneData(null, null) };
            yield return new object[] { new ContactPhoneData(string.Empty, string.Empty) };
            yield return new object[] { new ContactPhoneData("  ", "  ") };
        }

        [Theory]
        [MemberData(nameof(InvalidPersonalInfo))]
        public void AddOrUpdatePersonalInfoContactFacetIfNecessary_ShouldBeFalse_IfPersonalInfoIsNotValid(ContactPersonalInfoData personalInfo)
        {
            // Act
            var actual = FacetHelper.AddOrUpdatePersonalInfoContactFacetIfNecessary(null, null, personalInfo);

            // Assert
            actual.Should().BeFalse();
        }

        [Theory]
        [AutoData]
        public void AddOrUpdatePersonalInfoContactFacetIfNecessary_ShouldBeTrue_IfContactHasNoFacet(Contact contact, ContactPersonalInfoData personalInfo)
        {
            // Arrange
            var client = Substitute.For<IXdbContext>();

            // Act
            var actual = FacetHelper.AddOrUpdatePersonalInfoContactFacetIfNecessary(contact, client, personalInfo);

            // Assert
            actual.Should().BeTrue();
        }

        [Theory]
        [AutoData]
        public void AddOrUpdatePersonalInfoContactFacetIfNecessary_ShouldBeFalse_IfPersonalInfoHasNotChanged(Contact contact, ContactPersonalInfoData personalInfo)
        {
            // Arrange
            var facet = new PersonalInformation()
            {
                FirstName = personalInfo.FirstName,
                LastName = personalInfo.LastName,
                Title = personalInfo.Title,
            };

            DeserializationHelpers.SetFacet(contact, PersonalInformation.DefaultFacetKey, facet);

            // Act
            var actual = FacetHelper.AddOrUpdatePersonalInfoContactFacetIfNecessary(contact, null, personalInfo);

            // Assert
            actual.Should().BeFalse();
        }

        [Theory]
        [AutoData]
        public void AddOrUpdatePersonalInfoContactFacetIfNecessary_ShouldBeTrue_IfPersonalInfoHasChanged(Contact contact, ContactPersonalInfoData personalInfo)
        {
            // Arrange
            var facet = new PersonalInformation()
            {
                FirstName = "New First Name",
                LastName = personalInfo.LastName,
                Title = personalInfo.Title,
            };

            var client = Substitute.For<IXdbContext>();

            DeserializationHelpers.SetFacet(contact, PersonalInformation.DefaultFacetKey, facet);

            // Act
            var actual = FacetHelper.AddOrUpdatePersonalInfoContactFacetIfNecessary(contact, client, personalInfo);

            // Assert
            actual.Should().BeTrue();
        }

        [Theory]
        [InlineData("  ")]
        [InlineData(null)]
        [InlineData("")]
        public void AddOrUpdateEmailAddressListFacetIfNecessary_ShouldBeFalse_IfEmailIsNotValid(string email)
        {
            // Act
            var actual = FacetHelper.AddOrUpdateEmailAddressListFacetIfNecessary(null, null, email);

            // Assert
            actual.Should().BeFalse();
        }

        [Theory]
        [AutoData]
        public void AddOrUpdateEmailAddressListFacetIfNecessary_ShouldBeTrue_IfContactHasNoFacet(Contact contact, string email)
        {
            // Arrange
            var client = Substitute.For<IXdbContext>();

            // Act
            var actual = FacetHelper.AddOrUpdateEmailAddressListFacetIfNecessary(contact, client, email);

            // Assert
            actual.Should().BeTrue();
        }

        [Theory]
        [AutoData]
        public void AddOrUpdateEmailAddressListFacetIfNecessary_ShouldBeFalse_IfEmailHasNotChanged(Contact contact, string email, string preferredKey)
        {
            // Arrange
            var facet = new EmailAddressList(new EmailAddress(email, true), preferredKey);

            DeserializationHelpers.SetFacet(contact, EmailAddressList.DefaultFacetKey, facet);

            // Act
            var actual = FacetHelper.AddOrUpdateEmailAddressListFacetIfNecessary(contact, null, email);

            // Assert
            actual.Should().BeFalse();
        }

        [Theory]
        [AutoData]
        public void AddOrUpdateEmailAddressListFacetIfNecessary_ShouldBeTrue_IfEmailHasChanged(Contact contact, string email, string preferredKey)
        {
            // Arrange
            var facet = new EmailAddressList(new EmailAddress("test@test.com", true), preferredKey);

            var client = Substitute.For<IXdbContext>();

            DeserializationHelpers.SetFacet(contact, PersonalInformation.DefaultFacetKey, facet);

            // Act
            var actual = FacetHelper.AddOrUpdateEmailAddressListFacetIfNecessary(contact, client, email);

            // Assert
            actual.Should().BeTrue();
        }

        [Theory]
        [AutoData]
        public void AddOrUpdateEmailAddressListFacetIfNecessary_ShouldBeFalse_IfPreferredPhoneNumberKeyIsDefault(Contact contact, string email)
        {
            // Arrange
            var facet = new EmailAddressList(new EmailAddress(email, true), Constants.Tracking.PreferredEmailKey);

            var client = Substitute.For<IXdbContext>();

            DeserializationHelpers.SetFacet(contact, PersonalInformation.DefaultFacetKey, facet);

            // Act
            var actual = FacetHelper.AddOrUpdateEmailAddressListFacetIfNecessary(contact, client, email);

            // Assert
            actual.Should().BeTrue();
        }

        [Theory]
        [MemberData(nameof(InvalidPhoneData))]
        public void AddOrUpdatePhoneNumberFacetIfNecessary_ShouldBeFalse_IfPhoneInfoIsNotValid(ContactPhoneData phoneData)
        {
            // Act
            var actual = FacetHelper.AddOrUpdatePhoneNumberFacetIfNecessary(null, null, phoneData);

            // Assert
            actual.Should().BeFalse();
        }

        [Theory]
        [AutoData]
        public void AddOrUpdatePhoneNumberFacetIfNecessary_ShouldBeTrue_IfContactHasNoFacet(Contact contact, ContactPhoneData phoneData)
        {
            // Arrange
            var client = Substitute.For<IXdbContext>();

            // Act
            var actual = FacetHelper.AddOrUpdatePhoneNumberFacetIfNecessary(contact, client, phoneData);

            // Assert
            actual.Should().BeTrue();
        }

        [Theory]
        [AutoData]
        public void AddOrUpdatePhoneNumberFacetIfNecessary_ShouldBeFalse_IfPhoneInfoHasNotChanged(Contact contact, ContactPhoneData phoneData, string preferredKey)
        {
            // Arrange
            var facet = new PhoneNumberList(new PhoneNumber(phoneData.MobilePhoneCode, phoneData.MobilePhoneNumber), preferredKey);

            DeserializationHelpers.SetFacet(contact, PhoneNumberList.DefaultFacetKey, facet);

            // Act
            var actual = FacetHelper.AddOrUpdatePhoneNumberFacetIfNecessary(contact, null, phoneData);

            // Assert
            actual.Should().BeFalse();
        }

        [Theory]
        [AutoData]
        public void AddOrUpdatePhoneNumberFacetIfNecessary_ShouldBeTrue_IfPhoneDataHasChanged(Contact contact, ContactPhoneData phoneData, string preferredKey)
        {
            // Arrange
            var facet = new PhoneNumberList(new PhoneNumber("44", phoneData.MobilePhoneNumber), preferredKey);

            var client = Substitute.For<IXdbContext>();

            DeserializationHelpers.SetFacet(contact, PersonalInformation.DefaultFacetKey, facet);

            // Act
            var actual = FacetHelper.AddOrUpdatePhoneNumberFacetIfNecessary(contact, client, phoneData);

            // Assert
            actual.Should().BeTrue();
        }

        [Theory]
        [AutoData]
        public void AddOrUpdatePhoneNumberFacetIfNecessary_ShouldBeFalse_IfPreferredPhoneNumberKeyIsDefault(Contact contact, ContactPhoneData phoneData)
        {
            // Arrange
            var facet = new PhoneNumberList(new PhoneNumber("44", phoneData.MobilePhoneNumber), Constants.Tracking.PreferredPhoneNumberKey);

            var client = Substitute.For<IXdbContext>();

            DeserializationHelpers.SetFacet(contact, PersonalInformation.DefaultFacetKey, facet);

            // Act
            var actual = FacetHelper.AddOrUpdatePhoneNumberFacetIfNecessary(contact, client, phoneData);

            // Assert
            actual.Should().BeTrue();
        }
    }
}