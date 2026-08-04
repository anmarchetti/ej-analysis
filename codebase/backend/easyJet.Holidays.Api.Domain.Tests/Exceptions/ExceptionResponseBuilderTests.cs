using easyJet.Holidays.Api.Common.Exceptions;
using easyJet.Holidays.Api.Domain.Data.Errors;
using easyJet.Holidays.Api.Domain.Exceptions;
using easyJet.Holidays.Api.Domain.Settings;
using FluentAssertions;
using Microsoft.AspNetCore.Http;
using System.Net;
using Xunit;

namespace easyJet.Holidays.Api.Domain.Tests.Exceptions
{
    public class ExceptionResponseBuilderTests
    {
        HttpContext _context;
        public ExceptionResponseBuilderTests()
        {
            _context = new DefaultHttpContext { TraceIdentifier = "idf" };
        }

        [Theory]
        [MemberData(nameof(BuildErrorObjectTestData))]
        public void BuildErrorObject_ReturnDictionary(bool returnInnerErrorsFromApi, bool returnExceptionDetailsFromApiErrors, ApiErrorResponse expected)
        {
            //Arrange
            var exception = new ApiException(
                new ExceptionCode { Code = "apiExc", Description = "apiDesc" },
                "incorrect data",
                new ApiError[] {
                    new ApiError { Code = "innerCode", Message = "innerMessage" } },
                new Exception(),
                HttpStatusCode.BadRequest,
                new Dictionary<string, string>());

            var settings = new EnvironmentBehaviourSettings { ReturnInnerErrorsFromApi = returnInnerErrorsFromApi, ReturnExceptionDetailsFromApiErrors = returnExceptionDetailsFromApiErrors };
            // Act
            var returnVal = ExceptionResponseBuilder.BuildErrorObject(_context, exception, settings);

            // Assert
            returnVal.Should().BeEquivalentTo(expected);
        }

        public static readonly List<object[]> BuildErrorObjectTestData = new List<object[]>()
        {
            new object[] { true, true, new ApiErrorResponse
            {
                Error = "apiDesc",
                Code = "apiExc",
                CorrelationId = "idf",
                AdditionalData = new Dictionary<string, string>(),
                InnerErrors = new ApiError[] { new ApiError { Code = "innerCode", Message = "innerMessage" } },
                StackTrace = null
            }
            },
            new object[] { false, true, new ApiErrorResponse
            {
                Error = "apiDesc",
                Code = "apiExc",
                CorrelationId = "idf",
                AdditionalData = new Dictionary<string, string>(),
                InnerErrors = new ApiError[] { new ApiError { Code = "innerCode" } },
                StackTrace = null
            }
            }
        };
    }
}
