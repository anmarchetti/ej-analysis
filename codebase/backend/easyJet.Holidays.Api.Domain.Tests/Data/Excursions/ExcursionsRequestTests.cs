using easyJet.Holidays.Api.Domain.Data.Excursions;
using easyJet.Holidays.Api.Domain.Utils;
using FluentAssertions;
using Xunit;

namespace easyJet.Holidays.Api.Domain.Tests
{
    public class ExcursionsRequestTests
    {
        [Theory]
        [MemberData(nameof(ExcursionsRequestTestsData.Map_OneFieldOfDateRangeNotSet), MemberType = typeof(ExcursionsRequestTestsData))]
        public void Validate_OneFieldOfDateRangeNotSet_OnEachError(ExcursionsRequest request)
        {
            // Act
            var actual = request.Validate(new System.ComponentModel.DataAnnotations.ValidationContext(request, null, new Dictionary<object, object>()));

            // Assert
            actual.Select(v => v.ErrorMessage).Any(m => m == $"Both date range filters [`{nameof(request.StartDate)}`,`{nameof(request.EndDate)}`] must be provided").Should().BeTrue();
        }

        [Theory]
        [MemberData(nameof(ExcursionsRequestTestsData.Map_DateRangeFieldsNotParsed), MemberType = typeof(ExcursionsRequestTestsData))]
        public void Validate_DateRangeFieldsNotParsed_ReturnError(ExcursionsRequest request)
        {
            // Act
            var actual = request.Validate(new System.ComponentModel.DataAnnotations.ValidationContext(request, null, new Dictionary<object, object>()));

            // Assert
            actual.Select(v => v.ErrorMessage).Any(m => m == $"Can not parse startDate: {request.StartDate}, expected format: {DateFormatUtils.DateOnlyFormat}").Should().BeTrue();
            actual.Select(v => v.ErrorMessage).Any(m => m == $"Can not parse endDate: {request.EndDate}, expected format: {DateFormatUtils.DateOnlyFormat}").Should().BeTrue();
        }

        [Theory]
        [MemberData(nameof(ExcursionsRequestTestsData.Map_StartDateGreaterThanEndDate), MemberType = typeof(ExcursionsRequestTestsData))]
        public void Validate_StartDateGreaterThanEndDate_ReturnError(ExcursionsRequest request)
        {
            // Act
            var actual = request.Validate(new System.ComponentModel.DataAnnotations.ValidationContext(request, null, new Dictionary<object, object>()));

            // Assert
            actual.Select(v => v.ErrorMessage).Any(m => m == $"StartDate: {request.StartDate} cannot be greater then EndDate: {request.EndDate}").Should().BeTrue();
        }
    }

    public class ExcursionsRequestTestsData
    {
        public static IEnumerable<object[]> Map_OneFieldOfDateRangeNotSet =>
            new List<object[]>
            {
                new object[]
                {
                    new ExcursionsRequest
                    {
                        DestinationCode = "FR",
                        StartDate = "2022-01-18"
                    }
                },
                new object[]
                {
                    new ExcursionsRequest
                    {
                        DestinationCode = "FR",
                        EndDate = "2022-01-18"
                    }
                }
            };

        public static IEnumerable<object[]> Map_DateRangeFieldsNotParsed =>
            new List<object[]>
            {
                new object[]
                {
                    new ExcursionsRequest
                    {
                        DestinationCode = "FR",
                        StartDate = "2022-01-18a",
                        EndDate = "2022-0a-31"
                    }
                },
                new object[]
                {
                    new ExcursionsRequest
                    {
                        DestinationCode = "FR",
                        StartDate = "2022-01-18T03:00:00",
                        EndDate = "2022-02-31"
                    }
                },
                new object[]
                {
                    new ExcursionsRequest
                    {
                        DestinationCode = "FR",
                        StartDate = "2022-01-18T03:00:00",
                        EndDate = "2022-01-31T11:00:00"
                    }
                },
            };

        public static IEnumerable<object[]> Map_StartDateGreaterThanEndDate =>
            new List<object[]>
            {
                 new object[]
                {
                    new ExcursionsRequest
                    {
                        DestinationCode = "FR",
                        StartDate = "2022-01-18",
                        EndDate = "2022-01-17"
                    }
                },
            };
    }
}
