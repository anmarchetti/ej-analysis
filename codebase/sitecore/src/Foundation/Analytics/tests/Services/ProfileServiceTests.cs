using System;
using System.Collections.Generic;
using System.Xml;
using AutoFixture;
using easyJet.Foundation.Analytics.Services;
using easyJet.Foundation.SitecoreExtensions.Logging;
using FluentAssertions;
using NSubstitute;
using NSubstitute.Extensions;
using Sitecore.Analytics.Tracking;
using Sitecore.Data.Items;
using Sitecore.Exceptions;
using Sitecore.NSubstituteUtils;
using Xunit;

namespace easyJet.Foundation.Analytics.Tests.Services
{
    public class ProfileServiceTests
    {
        private readonly Fixture fixture;
        private readonly ISitecoreExtensionsLogger loggerMock;
        private readonly ProfileService sut;

        public ProfileServiceTests()
        {
            fixture = new Fixture();
            loggerMock = Substitute.For<ISitecoreExtensionsLogger>();
            sut = Substitute.ForPartsOf<ProfileService>(loggerMock);
        }

        [Fact]
        public void TagProfile_WithItemMissingTrackingField_ReturnsFalseWithoutFurtherAction()
        {
            // Arrange
            var item = FakeUtil.FakeItem("an item without a tracking field");
            FakeUtil.FakeItemFields(item);

            // Act
            var result = sut.TagProfile(item, default, default);

            // Assert
            result.Should().BeFalse();
            loggerMock.DidNotReceiveWithAnyArgs().Error(message: default, exception: default, owner: default);
        }

        [Fact]
        public void TagProfile_WithNullParamItem_LogsErrorAndReturnsFalse()
        {
            // Arrange
            var item = null as Item;

            // Act
            var result = sut.TagProfile(item, default, default);

            // Assert
            result.Should().BeFalse();
            // ItemNullException as it is thrown inside GetItemTrackingFieldAndContentProfile
            loggerMock.Received().Error(Arg.Any<string>(), Arg.Any<ItemNullException>(), Arg.Any<object>());
        }

        [Fact]
        public void BoostUserPattern_WithValidPatternCardAndProfile_UpdatesProfile_ReturnsTrue()
        {
            // Arrange
            var patternCard = FakeUtil.FakeItem("fakePatternCardName");
            var profile = new Profile("testProfileName");
            var profileCard = FakeUtil.FakeItem();

            var patternCardName = fixture.Create<string>();
            var firstXml = new XmlDocument();
            firstXml.LoadXml(ProfileServiceTestsData.ValidXmlForWithValidPatternCardAndProfile(patternCardName, fixture.Create<double>().ToString()));

            var profileCardValue = fixture.Create<double>().ToString();
            var secondXml = new XmlDocument();
            secondXml.LoadXml(ProfileServiceTestsData.ValidXmlForWithValidPatternCardAndProfile(patternCard.Name, profileCardValue));

            sut.Configure().WhenForAnyArgs(mock => mock.GetXmlDocumentFromFieldByName(default, default)).DoNotCallBase();
            sut.GetXmlDocumentFromFieldByName(default, default).ReturnsForAnyArgs(firstXml, secondXml);
            sut.Configure().WhenForAnyArgs(mock => mock.UpdateProfile(default, default)).DoNotCallBase();

            // Act
            var result = sut.BoostUserPattern(patternCard, profile, profileCard);

            // Assert
            result.Should().BeTrue();
            sut.Received().UpdateProfile(profile, Arg.Is<Dictionary<string, double>>(arg =>
                arg.ContainsKey(patternCardName) &&
                arg.ContainsValue(double.Parse(profileCardValue))));
        }

        [Theory]
        [MemberData(nameof(ProfileServiceTestsData.BoostUserPattern_InvalidPatternCardOrProfilePropertiesData), MemberType = typeof(ProfileServiceTestsData))]
        public void BoostUserPattern_InvalidPatternCardOrProfileProperties_DoesNotUpdate_LogsAndReturnsFalse(Item patternCard, Profile profile)
        {
            // Arrange

            // Act
            var result = sut.BoostUserPattern(patternCard, profile, default);

            // Assert
            loggerMock.ReceivedWithAnyArgs().Debug(message: default, owner: default);
            result.Should().BeFalse();
        }

        [Fact]
        public void BoostUserProfile_WhenPatternIsNull_LogsAndReturnsFalse()
        {
            // Arrange

            // Act
            var result = sut.BoostUserProfile(null, null, null);

            // Assert
            loggerMock.ReceivedWithAnyArgs().Debug(message: default, owner: default);
            result.Should().BeFalse();
        }

        [Fact]
        public void BoostUserProfile_WithPresentPatternCard_ExecutesAndReturnsTrue()
        {
            // Arrange
            var patternCard = FakeUtil.FakeItem("fakePatternCard");
            var profileCard = FakeUtil.FakeItem("fakeProfileCard");

            var firstXml = new XmlDocument();
            firstXml.LoadXml(ProfileServiceTestsData.ValidXmlForWithValidPatternCardAndProfile(fixture.Create<string>(), fixture.Create<double>().ToString()));

            sut.Configure().WhenForAnyArgs(mock => mock.GetXmlDocumentFromFieldByName(default, default)).DoNotCallBase();
            sut.GetXmlDocumentFromFieldByName(default, default).ReturnsForAnyArgs(firstXml);
            sut.Configure().WhenForAnyArgs(mock => mock.UpdateProfile(default, default)).DoNotCallBase();

            var profile = Substitute.For<Profile>("testProfile");
            profile.PatternId = Guid.NewGuid();
            profile.PatternLabel = string.Empty;

            // Act
            var result = sut.BoostUserProfile(patternCard, profile, profileCard);

            // Assert
            loggerMock.DidNotReceiveWithAnyArgs().Debug(message: default, owner: default);
            result.Should().BeTrue();
        }
    }
}
