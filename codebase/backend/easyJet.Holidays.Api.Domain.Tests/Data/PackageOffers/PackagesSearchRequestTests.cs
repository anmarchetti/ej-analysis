using easyJet.Holidays.Api.Domain.Data.PackageOffers;
using easyJet.Holidays.Api.Domain.Settings;
using FluentAssertions;
using Microsoft.Extensions.Options;
using Xunit;

namespace easyJet.Holidays.Api.Domain.Tests
{
    public class PackagesSearchRequestTests
    {
        [Theory]
        [MemberData(nameof(PackagesSearchRequestTestsData.Map_InvalidRequest), MemberType = typeof(PackagesSearchRequestTestsData))]
        public void Validate_OnEmptyGeographyAndAccomCodeAndPromoIsFalse_HasError(PackagesSearchRequest request)
        {
            // Act
            var actual = request.Validate(new System.ComponentModel.DataAnnotations.ValidationContext(request, new PackagesSearchRequestTestsServiceProvider(), new Dictionary<object, object>()));

            // Assert
            actual.Select(v => v.ErrorMessage).Any(m => m == "Geography or AccomCode should be specified").Should().BeTrue();
        }

        [Theory]
        [MemberData(nameof(PackagesSearchRequestTestsData.Map_ValidRequest), MemberType = typeof(PackagesSearchRequestTestsData))]
        public void Validate_OnEmptyGeographyAndAccomCodeAndPromoIsTrue_HasNoError(PackagesSearchRequest request)
        {
            // Act
            var actual = request.Validate(new System.ComponentModel.DataAnnotations.ValidationContext(request, new PackagesSearchRequestTestsServiceProvider(), new Dictionary<object, object>()));

            // Assert
            actual.Select(v => v.ErrorMessage).Any(m => m == "Geography or AccomCode should be specified").Should().BeFalse();
        }

        public class PackagesSearchRequestTestsData
        {
            public static IEnumerable<object[]> Map_InvalidRequest =>
                new List<object[]>
                {
                    new object[] {
                        new PackagesSearchRequest
                        {
                            AccomCodes = string.Empty,
                            Geography = string.Empty
                        }
                    }
                };

            public static IEnumerable<object[]> Map_ValidRequest =>
                new List<object[]>
                {
                    new object[] {
                        new PackagesSearchRequest
                        {
                            AccomCodes = string.Empty,
                            Geography = string.Empty,
                            IsPromo = true
                        }
                    }
                };
        }

        public class PackagesSearchRequestTestsServiceProvider : IServiceProvider
        {
            public object GetService(Type serviceType)
            {
                if (serviceType == typeof(IOptions<SearchSettings>))
                {
                    return new PackagesSearchRequestTestsServiceOptionsSearchSettings();
                }

                return null;
            }
        }


        public class PackagesSearchRequestTestsServiceOptionsSearchSettings : IOptions<SearchSettings>
        {
            public SearchSettings Value => new SearchSettings();
        }

        [Theory]
        [MemberData(nameof(Data))]
        public void DistinctAccomIds_AccomCodesAndDestination_ReturnsCorrectIds(string accomIds, string[] destinations, string[] expected)
        {
            var sut = new PackagesSearchRequest { AccomCodes = accomIds, Destinations = destinations };

            var result = sut.DistinctAccomIds();

            result.Should().BeEquivalentTo(expected);
        }

        public static TheoryData<string, string[], string[]> Data
        {
            get
            {
                var data = new TheoryData<string, string[], string[]>
                {
                    { "accom1,accom2,accom3", ["hotel:accom4", "hotel:accom1"], ["accom1", "accom2", "accom3", "accom4"] },
                    { "accom1,accom2,accom3", null, ["accom1", "accom2", "accom3"] },
                    { "", ["hotel:accom1", "hotel:accom2", "hotel:accom3"], ["accom1", "accom2", "accom3"] },
                    { "", [], [] },
                    { "", null, [] },
                };
                return data;
            }
        }

    }
}
