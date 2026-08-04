using System.Collections.Generic;
using easyJet.Foundation.Atcom.AtcomSoapServices;
using easyJet.Foundation.Atcom.Logging;
using easyJet.Foundation.Atcom.Models;
using easyJet.Foundation.Atcom.Services;
using FluentAssertions;
using NSubstitute;
using Sitecore.Configuration;
using Xunit;

namespace easyJet.Foundation.Atcom.Tests.Services
{
    public class MasterDataServiceTests
    {
        private const string MockDefaultLanguage = "en_EN";
        private readonly MasterDataService sut;

        public MasterDataServiceTests()
        {
            var loggerSub = Substitute.For<IAtcomLogger>();
            sut = Substitute.For<MasterDataService>(loggerSub);
        }

        [Fact]
        public void GetCacheKey_WithoutParentAndLanguage_BuildsKey()
        {
            // Arrange
            Obj_TpType type = Obj_TpType.LI;
            var parent = string.Empty;
            var language = string.Empty;
            var expected = $"Atcom.Cache.{type}";

            // Act
            var actual = sut.GetCacheKey(type, parent, language);

            // Assert
            actual.Should().Be(expected);
        }

        [Fact]
        public void GetCacheKey_WithoutParentWithLanguage_BuildsKey()
        {
            // Arrange
            Obj_TpType type = Obj_TpType.LI;
            var parent = string.Empty;
            var language = "testLanguageCode";

            // Act
            var actual = sut.GetCacheKey(type, parent, language);

            // Assert
            actual.Should().Contain(type.ToString());
            actual.Should().Contain(language);
        }

        [Fact]
        public void GetCacheKey_WithParentAndLanguage_BuildsKey()
        {
            // Arrange
            Obj_TpType type = Obj_TpType.LI;
            var parent = "testParent";
            var language = "testLanguage";

            // Act
            var actual = sut.GetCacheKey(type, parent, language);

            // Assert
            actual.Should().Contain(type.ToString());
            actual.Should().Contain(parent);
            actual.Should().Contain(language);
        }

        [Theory]
        [MemberData(nameof(MapToDataObject_MapsCorrectly_TestDataGenerator))]
        public void MapToDataObject_MapsCorrectly(ObjectsObject objectToMap, string languageCode, DataObject expected)
        {
            // Arrange
            using (new SettingsSwitcher("Atcom.DefaultLanguage", MockDefaultLanguage))
            {
                // Act
                var actual = sut.MapToDataObject(objectToMap);

                // Assert
                actual.Name.Should().Be(expected.Name);
                actual.Code.Should().Be(expected.Code);
            }
        }

        public static List<object[]> MapToDataObject_MapsCorrectly_TestDataGenerator =>
            new List<object[]>()
            {
                // Just english
                new object[]
                {
                    new ObjectsObject()
                    {
                        Obj_Cd = "TEST01",
                        Name = new[] { new ObjectsObjectName() { Lang_Locale_Cd = MockDefaultLanguage, Value = "TestName_EN" } }
                    },
                    MockDefaultLanguage,
                    new DataObject("TEST01", "TestName_EN")
                },
                // english name as well as a localized name for display purposes
                new object[]
                {
                    new ObjectsObject()
                    {
                        Obj_Cd = "TEST02",
                        Name = new[]
                        {
                            new ObjectsObjectName() { Lang_Locale_Cd = MockDefaultLanguage, Value = "TestName_EN" },
                            new ObjectsObjectName() { Lang_Locale_Cd = "lang_TEST", Value = "TestName_TEST" }
                        }
                    },
                    "lang_TEST",
                    new DataObject("TEST02", "TestName_EN")
                },
                // localized name will stay empty. attempt will be made to retrieve, but there is no matching element.
                new object[]
                {
                    new ObjectsObject()
                    {
                        Obj_Cd = "TEST02",
                        Name = new[]
                        {
                            new ObjectsObjectName() { Lang_Locale_Cd = MockDefaultLanguage, Value = "TestName_EN" }
                        }
                    },
                    "lang_TEST",
                    new DataObject("TEST02", "TestName_EN")
                }
            };
    }
}
