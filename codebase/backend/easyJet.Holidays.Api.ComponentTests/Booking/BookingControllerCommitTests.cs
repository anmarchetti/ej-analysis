using easyJet.Holidays.Api.Common.Exceptions;
using easyJet.Holidays.Api.ComponentTests.Infrastructure;
using easyJet.Holidays.Api.ComponentTests.Utils;
using easyJet.Holidays.Api.Controllers.Booking;
using easyJet.Holidays.Api.Domain.Data.Booking;
using easyJet.Holidays.Tests.Domain.ComponentTests;
using easyJet.Holidays.Tests.Domain.Integration;
using FluentAssertions;
using Microsoft.Net.Http.Headers;
using Newtonsoft.Json;
using Newtonsoft.Json.Linq;
using System.Net;
using System.Text;
using Xunit;

namespace easyJet.Holidays.Api.ComponentTests.Booking;

/// <summary>
/// Component tests for <see cref="BookingController"/>
/// </summary>
public class BookingControllerCommitTests : BaseFixtureAwareComponentTest
{
    public BookingControllerCommitTests(WebApplicationFixture webApp) : base(webApp)
    {
    }

    [Trait("Api", "/api/v1.0/booking/commit")]
    [Trait("Category", "Component")]
    [Fact]
    public async Task CommitBooking_ValidationFail_BrowserInfoMissing()
    {
        // Title: Mr, Mrs, Miss, Ms

        // Act
        var response = await Client.PostAsync("/api/v1/booking/commit", new StringContent(@"
                {
                    ""leadPassenger"": {
                        ""email"": ""ant@on.com"",
                        ""address"": ""qwerty"",
                        ""address2"": ""qwerty"",
                        ""townCity"": ""London"",
                        ""phone"": ""65489645"",
                        ""dialingCode"": ""+44"",
                        ""countryCode"": ""AZE"",
                        ""postCode"": ""220033"",
                        ""dateOfBirth"": ""2000-10-12""
                    },
                    ""guests"": [
                        {
                            ""type"": ""ADULT"",
                            ""title"": ""Mr"",
                            ""firstName"": ""Anton"",
                            ""lastName"": ""Trukh"",
                            ""age"": 18,
                            ""Sex"": ""SEX_UNKNOWN"",
                        }
                    ],
                    ""offer"": {}
            }", Encoding.UTF8, "application/json"));
        var content = await response.Content.ReadAsStringAsync();
        var responseData = JsonConvert.DeserializeObject<JObject>(content)!;

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.BadRequest);

        var allErrors = responseData["innerErrors"]?.SelectMany(x => x.Children()).Select(u => u as JProperty).Select(t => t?.Value).Select(v => v?.Value<string>()).ToList();

        allErrors!.Count.Should().Be(1);
        allErrors.Should().Contain("The BrowserInfo field is required.");
    }

    [Trait("Api", "/api/v1.0/booking/commit")]
    [Trait("Category", "Component")]
    [Fact]
    public async Task CommitBooking_ValidationFail_TitleNoMatch()
    {
        // Title: Mr, Mrs, Miss, Ms

        // Act
        var response = await Client.PostAsync("/api/v1/booking/commit", new StringContent(@"
                {
                    ""leadPassenger"": {
                        ""email"": ""ant@on.com"",
                        ""address"": ""qwerty"",
                        ""address2"": ""qwerty"",
                        ""townCity"": ""London"",
                        ""phone"": ""65489645"",
                        ""dialingCode"": ""+44"",
                        ""countryCode"": ""AZE"",
                        ""postCode"": ""220033"",
                        ""dateOfBirth"": ""2000-10-12""
                    },
                    ""guests"": [
                        {
                            ""type"": ""ADULT"",
                            ""title"": ""Mister"",
                            ""firstName"": ""Anton"",
                            ""lastName"": ""Trukh"",
                            ""age"": 18,
                            ""Sex"": ""SEX_UNKNOWN"",
                        }
                    ],
                    ""offer"": {},
                    ""browserInfo"":{
                        ""acceptHeader"":""application / json"",
                        ""userAgent"":""Mozilla / 5.0(Windows NT 10.0; Win64; x64) AppleWebKit / 537.36(KHTML, like Gecko) Chrome / 78.0.3879.0 Safari / 537.36 Edg / 78.0.249.1"",
                        ""colourDepth"":24,
                        ""javaEnabled"":false,
                        ""javaScriptEnabled"":true,
                        ""language"":""en - GB"",
                        ""screenHeight"":1080,
                        ""screenWidth"":1920,
                        ""timeZoneOffset"":-180
                    }
            }", Encoding.UTF8, "application/json"));
        var content = await response.Content.ReadAsStringAsync();
        var responseData = JsonConvert.DeserializeObject<JObject>(content);

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.BadRequest);

        var allErrors = responseData?["innerErrors"]?.SelectMany(x => x.Children()).Select(u => u as JProperty).Select(t => t?.Value).Select(v => v?.Value<string>()).ToList();

        allErrors!.Count.Should().Be(1);
        allErrors.Should().Contain("The Title field can only be one of Mr, Mrs, Miss, Ms, Chd, Mr+Inf, Mrs+Inf, Miss+Inf or Ms+Inf.");
    }

    [Trait("Api", "/api/v1.0/booking/commit")]
    [Trait("Category", "Component")]
    [Fact]
    public async Task CommitBooking_ValidationFail_FirstLastNameInvalid()
    {
        // First name, Surname:	Anything other than alphanumeric characters, hyphens and white spaces

        // Act
        var response = await Client.PostAsync("/api/v1/booking/commit", new StringContent(@"
                {
                    ""leadPassenger"": {
                        ""email"": ""ant@on.com"",
                        ""address"": ""qwerty"",
                        ""address2"": ""qwerty"",
                        ""townCity"": ""London"",
                        ""phone"": ""65489645"",
                        ""dialingCode"": ""+44"",
                        ""countryCode"": ""AZE"",
                        ""postCode"": ""220033"",
                        ""dateOfBirth"": ""2000-10-12""
                    },
                    ""guests"": [
                        {
                            ""type"": ""ADULT"",
                            ""title"": ""Mr"",
                            ""firstName"": ""Anto34n["",
                            ""lastName"": ""Smi34th}"",
                            ""age"": 18,
                            ""Sex"": ""SEX_UNKNOWN"",
                        }
                    ],
                    ""offer"": {},
                    ""browserInfo"":{
                        ""acceptHeader"":""application / json"",
                        ""userAgent"":""Mozilla / 5.0(Windows NT 10.0; Win64; x64) AppleWebKit / 537.36(KHTML, like Gecko) Chrome / 78.0.3879.0 Safari / 537.36 Edg / 78.0.249.1"",
                        ""colourDepth"":24,
                        ""javaEnabled"":false,
                        ""javaScriptEnabled"":true,
                        ""language"":""en - GB"",
                        ""screenHeight"":1080,
                        ""screenWidth"":1920,
                        ""timeZoneOffset"":-180
                    }
            }", Encoding.UTF8, "application/json"));
        var content = await response.Content.ReadAsStringAsync();
        var responseData = JsonConvert.DeserializeObject<JObject>(content);

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.BadRequest);

        var allErrors = responseData?["innerErrors"]?.SelectMany(x => x.Children()).Select(u => u as JProperty).Select(t => t?.Value).Select(v => v?.Value<string>()).ToList();

        allErrors!.Count.Should().Be(2);
        allErrors.Should().Contain("The field First Name must not contain invalid characters.");
        allErrors.Should().Contain("The field Last Name must not contain invalid characters.");
    }

    [Trait("Api", "/api/v1.0/booking/commit")]
    [Trait("Category", "Component")]
    [Fact]
    public async Task CommitBooking_ValidationFail_AddressFieldsInvalid()
    {
        // First name, Surname:	Anything other than alphanumeric characters, hyphens and white spaces

        // Act
        var response = await Client.PostAsync("/api/v1/booking/commit", new StringContent(@"
                {
                    ""leadPassenger"": {
                        ""email"": ""ant@on.co@m"",
                        ""address"": ""qwerty$"",
                        ""address2"": ""qwerty!"",
                        ""townCity"": ""London%"",
                        ""phone"": ""65489e3645"",
                        ""dialingCode"": ""+44"",
                        ""countryCode"": ""AZE"",
                        ""postCode"": ""123213123123123121232220-0w04r"",
                        ""dateOfBirth"": ""2000-10-12""
                    },
                    ""guests"": [
                        {
                            ""type"": ""ADULT"",
                            ""title"": ""Mr"",
                            ""firstName"": ""Anton"",
                            ""lastName"": ""Smith"",
                            ""age"": 18,
                            ""Sex"": ""SEX_UNKNOWN"",
                        }
                    ],
                    ""offer"": {},
                    ""browserInfo"":{
                        ""acceptHeader"":""application / json"",
                        ""userAgent"":""Mozilla / 5.0(Windows NT 10.0; Win64; x64) AppleWebKit / 537.36(KHTML, like Gecko) Chrome / 78.0.3879.0 Safari / 537.36 Edg / 78.0.249.1"",
                        ""colourDepth"":24,
                        ""javaEnabled"":false,
                        ""javaScriptEnabled"":true,
                        ""language"":""en - GB"",
                        ""screenHeight"":1080,
                        ""screenWidth"":1920,
                        ""timeZoneOffset"":-180
                    }
            }", Encoding.UTF8, "application/json"));
        var content = await response.Content.ReadAsStringAsync();
        var responseData = JsonConvert.DeserializeObject<JObject>(content);

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.BadRequest);

        var allErrors = responseData?["innerErrors"]?.SelectMany(x => x.Children()).Select(u => u as JProperty).Select(t => t?.Value).Select(v => v?.Value<string>()).ToList();

        allErrors!.Count.Should().Be(6);
        allErrors.Should().Contain("The field Address must not contain invalid characters.");
        allErrors.Should().Contain("The field Address Line 2 must not contain invalid characters.");
        allErrors.Should().Contain("The field Town / City must not contain invalid characters.");
        allErrors.Should().Contain("Postal code must be between two and fifteen characters of length.");
        allErrors.Should().Contain("The field Phone must not contain invalid characters.");
        allErrors.Should().Contain("The Email field is not a valid e-mail address.");
    }

    [Trait("Api", "/api/v1.0/booking/commit")]
    [Trait("Category", "Component")]
    [Fact]
    public async Task CommitBooking_ValidationFail_FirstLastEmail_TooLong()
    {
        // First name, Surname:	Anything other than alphanumeric characters, hyphens and white spaces

        // Act
        var response = await Client.PostAsync("/api/v1/booking/commit", new StringContent(@"
                {
                    ""leadPassenger"": {
                        ""email"": ""22tyuiopasdfghjkl098732165498703216549870321654987032165498703216549870321654987032165498722tyuiopasdfghjkl098732165qazxswedcvfrtgbnhyujmkiolpqazxc498703216549870321654987032165498703216549870321654987032165498712345678901234567890132456790asdqw@on.oiuy.com"",
                        ""address"": ""zx-cvb nm asdfg hjk lqwert y-uiop asdn, poop as-fas"",
                        ""address2"": ""zx-cvb nm asdfg hjk lqwert y-uiop asdn, poop as-fas"",
                        ""townCity"": ""zxc-vb nm asdfg hjk lqwert yui-op"",
                        ""phone"": ""778876655544"",
                        ""dialingCode"": ""+44"",
                        ""countryCode"": ""AZE"",
                        ""postCode"": ""220033"",
                        ""dateOfBirth"": ""2000-10-12""
                    },
                    ""guests"": [
                        {
                            ""type"": ""ADULT"",
                            ""title"": ""Mr"",
                            ""firstName"": ""zxcvb nm asdfg hjk lqwert yuiop"",
                            ""lastName"": ""zxcvb nm asdfg hjk lqwert yuiop"",
                            ""age"": 18,
                            ""Sex"": ""SEX_UNKNOWN"",
                        }
                    ],
                    ""offer"": {},
                    ""browserInfo"":{
                        ""acceptHeader"":""application / json"",
                        ""userAgent"":""Mozilla / 5.0(Windows NT 10.0; Win64; x64) AppleWebKit / 537.36(KHTML, like Gecko) Chrome / 78.0.3879.0 Safari / 537.36 Edg / 78.0.249.1"",
                        ""colourDepth"":24,
                        ""javaEnabled"":false,
                        ""javaScriptEnabled"":true,
                        ""language"":""en - GB"",
                        ""screenHeight"":1080,
                        ""screenWidth"":1920,
                        ""timeZoneOffset"":-180
                    }
            }", Encoding.UTF8, "application/json"));
        var content = await response.Content.ReadAsStringAsync();
        var responseData = JsonConvert.DeserializeObject<JObject>(content);

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.BadRequest);

        var allErrors = responseData?["innerErrors"]?.SelectMany(x => x.Children()).Select(u => u as JProperty).Select(t => t?.Value).Select(v => v?.Value<string>()).ToList();

        allErrors!.Count.Should().Be(6);
        allErrors.Should().Contain("The field Email must be a string with a maximum length of 256.");
        allErrors.Should().Contain("The field Address must be a string with a minimum length of 4 and a maximum length of 50.");
        allErrors.Should().Contain("The field Address Line 2 must be a string with a minimum length of 4 and a maximum length of 50.");
        allErrors.Should().Contain("The field Town / City must be a string with a minimum length of 2 and a maximum length of 30.");
        allErrors.Should().Contain("The field Last Name must be a string with a minimum length of 1 and a maximum length of 30.");
        allErrors.Should().Contain("The field First Name must be a string with a minimum length of 1 and a maximum length of 30.");
    }

    [Trait("Api", "/api/v1.0/booking/commit")]
    [Trait("Category", "Component")]
    [Fact]
    public async Task CommitBooking_ValidationFail_DiallingCode_Missing()
    {
        // First name, Surname:	Anything other than alphanumeric characters, hyphens and white spaces

        // Act
        var response = await Client.PostAsync("/api/v1/booking/commit", new StringContent(@"
                {
                    ""leadPassenger"": {
                        ""email"": ""qwe@on.oiuy.com"",
                        ""address"": ""zx-cvb nm asdfg hjk lqwert y-ui"",
                        ""address2"": ""zxc-vb nm asdfg hjk lqwert yui-"",
                        ""townCity"": ""zxc-vb nm asdfg hjk lqwert yui"",
                        ""phone"": ""778876655544"",
                        ""postCode"": ""220033"",
                        ""dateOfBirth"": ""2000-10-12""
                    },
                    ""guests"": [
                        {
                            ""type"": ""ADULT"",
                            ""title"": ""Mr"",
                            ""firstName"": ""zxcvb"",
                            ""lastName"": ""yuiop"",
                            ""age"": 18,
                            ""Sex"": ""SEX_UNKNOWN"",
                        }
                    ],
                    ""offer"": {},
                    ""browserInfo"":{
                        ""acceptHeader"":""application / json"",
                        ""userAgent"":""Mozilla / 5.0(Windows NT 10.0; Win64; x64) AppleWebKit / 537.36(KHTML, like Gecko) Chrome / 78.0.3879.0 Safari / 537.36 Edg / 78.0.249.1"",
                        ""colourDepth"":24,
                        ""javaEnabled"":false,
                        ""javaScriptEnabled"":true,
                        ""language"":""en - GB"",
                        ""screenHeight"":1080,
                        ""screenWidth"":1920,
                        ""timeZoneOffset"":-180
                    }
            }", Encoding.UTF8, "application/json"));
        var content = await response.Content.ReadAsStringAsync();
        var responseData = JsonConvert.DeserializeObject<JObject>(content);

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.BadRequest);

        var allErrors = responseData?["innerErrors"]?.SelectMany(x => x.Children()).Select(u => u as JProperty).Select(t => t?.Value).Select(v => v?.Value<string>()).ToList();

        allErrors!.Count.Should().Be(2);
        allErrors.Should().Contain("The Dialing Code field is required.");
        allErrors.Should().Contain("The Country Code field is required.");
    }

    [Trait("Api", "/api/v1.0/booking/commit")]
    [Trait("Category", "Component")]
    [Fact]
    public async Task CommitBooking_ValidationFail_CountryCode_Wrong()
    {
        // First name, Surname:	Anything other than alphanumeric characters, hyphens and white spaces

        // Act
        var response = await Client.PostAsync("/api/v1/booking/commit", new StringContent(@"
                {
                    ""leadPassenger"": {
                        ""email"": ""qwe@on.oiuy.com"",
                        ""address"": ""zx-cvb nm asdfg hjk lqwert y-ui"",
                        ""address2"": ""zxc-vb nm asdfg hjk lqwert yui-"",
                        ""townCity"": ""zxc-vb nm asdfg hjk lqwert yui"",
                        ""phone"": ""778876655544"",
                        ""countryCode"": ""AZR"",
                        ""postCode"": ""220033"",
                        ""dateOfBirth"": ""2000-10-12""
                    },
                    ""guests"": [
                        {
                            ""type"": ""ADULT"",
                            ""title"": ""Mr"",
                            ""firstName"": ""zxcvb"",
                            ""lastName"": ""yuiop"",
                            ""age"": 18,
                            ""Sex"": ""SEX_UNKNOWN"",
                        }
                    ],
                    ""offer"": {},
                    ""browserInfo"":{
                        ""acceptHeader"":""application / json"",
                        ""userAgent"":""Mozilla / 5.0(Windows NT 10.0; Win64; x64) AppleWebKit / 537.36(KHTML, like Gecko) Chrome / 78.0.3879.0 Safari / 537.36 Edg / 78.0.249.1"",
                        ""colourDepth"":24,
                        ""javaEnabled"":false,
                        ""javaScriptEnabled"":true,
                        ""language"":""en - GB"",
                        ""screenHeight"":1080,
                        ""screenWidth"":1920,
                        ""timeZoneOffset"":-180
                    }
            }", Encoding.UTF8, "application/json"));
        var content = await response.Content.ReadAsStringAsync();
        var responseData = JsonConvert.DeserializeObject<JObject>(content);

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.BadRequest);

        var allErrors = responseData?["innerErrors"]?.SelectMany(x => x.Children()).Select(u => u as JProperty).Select(t => t?.Value).Select(v => v?.Value<string>()).ToList();

        allErrors!.Count.Should().Be(2);
        allErrors.Should().Contain("The Dialing Code field is required.");
        allErrors.Should().Contain("The Country Code field must contain valid country code.");
    }

    [Trait("Api", "/api/v1.0/booking/commit")]
    [Trait("Category", "Component")]
    [Fact]
    public async Task CommitBookingWithBlockedEmail_ShouldFail()
    {
        // First name, Surname:	Anything other than alphanumeric characters, hyphens and white spaces

        // Act
        var response = await Client.PostAsync("/api/v1/booking/commit", new StringContent(@"
                {
                    ""leadPassenger"": {
                        ""email"": ""lockedBysitecore@easyjet.com"",
                        ""address"": ""zx-cvb nm asdfg hjk lqwert y-ui"",
                        ""address2"": ""zxc-vb nm asdfg hjk lqwert yui-"",
                        ""townCity"": ""zxc-vb nm asdfg hjk lqwert yui"",
                        ""phone"": ""778876655544"",
                        ""countryCode"": ""AZE"",
                        ""dialingCode"": ""44"",
                        ""postCode"": ""220033"",
                        ""dateOfBirth"": ""2000-10-12""
                    },
                    ""guests"": [
                        {
                            ""type"": ""ADULT"",
                            ""title"": ""Mr"",
                            ""firstName"": ""zxcvb"",
                            ""lastName"": ""yuiop"",
                            ""age"": 18,
                            ""Sex"": ""SEX_UNKNOWN"",
                        }
                    ],
                    ""offer"": {},
                    ""browserInfo"":{
                        ""acceptHeader"":""application / json"",
                        ""userAgent"":""Mozilla / 5.0(Windows NT 10.0; Win64; x64) AppleWebKit / 537.36(KHTML, like Gecko) Chrome / 78.0.3879.0 Safari / 537.36 Edg / 78.0.249.1"",
                        ""colourDepth"":24,
                        ""javaEnabled"":false,
                        ""javaScriptEnabled"":true,
                        ""language"":""en - GB"",
                        ""screenHeight"":1080,
                        ""screenWidth"":1920,
                        ""timeZoneOffset"":-180
                    }
            }", Encoding.UTF8, "application/json"));
        var content = await response.Content.ReadAsStringAsync();
        var responseData = JsonConvert.DeserializeObject<JObject>(content);

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.Forbidden);
        responseData?["error"]?.Value<string>().Should().Be("Customer email is locked");
    }

    [Trait("Api", "/api/v1.0/booking/commit")]
    [Trait("Category", "Component")]
    [Fact]
    public async Task CommitBooking_PaymentValidationFails_NoAgentCredentials_PaymentInfoNull()
    {
        // Arrange
        var requestContent = new StringContent(@"
            {
                ""offer"": {},
                ""leadPassenger"": {
                    ""email"": ""GluecklichPraechtigerHund@oida.icu"",
                    ""dateOfBirth"": ""1989-07-10"",
                    ""address"": ""asdfstreet 123"",
                    ""address2"": null,
                    ""townCity"": ""testville"",
                    ""postCode"": ""108"",
                    ""phone"": ""123141241"",
                    ""dialingCode"": ""44"",
                    ""countryCode"": ""GBR""
                },
                ""guests"": [
                    {
                        ""id"": ""70260f9c-6fac-e49a-e0f0-ab890002cdca"",
                        ""holydayStartDate"": ""2023-06-07T16:25:00.000Z"",
                        ""isLead"": true,
                        ""age"": 30,
                        ""notBornYet"": false,
                        ""Sex"": ""SEX_UNKNOWN"",
                        ""useSurnameAsLead"": false,
                        ""type"": ""ADULT"",
                        ""firstName"": ""Tester"",
                        ""lastName"": ""Testing"",
                        ""title"": ""MR"",
                        ""countryCode"": ""GBR"",
                        ""address"": ""asdfstreet 123"",
                        ""address2"": """",
                        ""city"": ""testville"",
                        ""postCode"": ""108"",
                        ""email"": ""GluecklichPraechtigerHund@oida.icu"",
                        ""dialingCode"": ""44"",
                        ""phone"": ""123141241"",
                        ""dateOfBirth"": ""1989-07-10""
                    },
                    {
                        ""id"": ""be98dcc6-20f5-0760-b68b-e17968289226"",
                        ""holydayStartDate"": ""2023-06-07T16:25:00.000Z"",
                        ""isLead"": false,
                        ""age"": 30,
                        ""notBornYet"": false,
                        ""Sex"": ""SEX_UNKNOWN"",
                        ""useSurnameAsLead"": true,
                        ""type"": ""ADULT"",
                        ""firstName"": ""asdf"",
                        ""lastName"": ""Testing"",
                        ""title"": ""Mr"",
                        ""countryCode"": ""GBR"",
                        ""dialingCode"": ""44""
                    }
                ],
                ""browserInfo"": {
                ""acceptHeader"": ""application/json"",
                    ""userAgent"": ""Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:104.0) Gecko/20100101 Firefox/104.0"",
                    ""colourDepth"": 24,
                    ""javaEnabled"": false,
                    ""javaScriptEnabled"": true,
                    ""language"": ""en-GB"",
                    ""screenHeight"": 1080,
                    ""screenWidth"": 1920,
                    ""timeZoneOffset"": 0
                },
                ""deviceId"": ""8cc825e0-3a1d-ae62-8939-bd0456bc0032""
            }", Encoding.UTF8, "application/json");

        // Act
        var response = await Client.PostAsync("/api/v1/booking/commit", requestContent);
        var content = await response.Content.ReadAsStringAsync();

        // Assert
        response.StatusCode.Should().Be(
            HttpStatusCode.BadRequest,
            "because without PaymentInfo AND AgentCredentials, this is a bad request."
        );
        content.Should().Contain(
            ApiExceptionCodes.BookingPaymentInfoError.Code,
            "because without AgentCredentials null instead of PaymentInfo is considered invalid."
        );
    }

    [Trait("Api", "/api/v1.0/booking/commit")]
    [Trait("Category", "Component")]
    [Fact]
    public async Task CommitBooking_PaymentValidationFails_NoAgentCredentials_PaymentInfoInvalid()
    {
        // Arrange
        var requestContent = new StringContent(@"
            {
                ""offer"": {},
                ""leadPassenger"": {
                    ""email"": ""GluecklichPraechtigerHund@oida.icu"",
                    ""dateOfBirth"": ""1989-07-10"",
                    ""address"": ""asdfstreet 123"",
                    ""address2"": null,
                    ""townCity"": ""testville"",
                    ""postCode"": ""108"",
                    ""phone"": ""123141241"",
                    ""dialingCode"": ""44"",
                    ""countryCode"": ""GBR""
                },
                ""guests"": [
                    {
                        ""id"": ""70260f9c-6fac-e49a-e0f0-ab890002cdca"",
                        ""holydayStartDate"": ""2023-06-07T16:25:00.000Z"",
                        ""isLead"": true,
                        ""age"": 30,
                        ""notBornYet"": false,
                        ""Sex"": ""SEX_UNKNOWN"",
                        ""useSurnameAsLead"": false,
                        ""type"": ""ADULT"",
                        ""firstName"": ""Tester"",
                        ""lastName"": ""Testing"",
                        ""title"": ""MR"",
                        ""countryCode"": ""GBR"",
                        ""address"": ""asdfstreet 123"",
                        ""address2"": """",
                        ""city"": ""testville"",
                        ""postCode"": ""108"",
                        ""email"": ""GluecklichPraechtigerHund@oida.icu"",
                        ""dialingCode"": ""44"",
                        ""phone"": ""123141241"",
                        ""dateOfBirth"": ""1989-07-10""
                    },
                    {
                        ""id"": ""be98dcc6-20f5-0760-b68b-e17968289226"",
                        ""holydayStartDate"": ""2023-06-07T16:25:00.000Z"",
                        ""isLead"": false,
                        ""age"": 30,
                        ""notBornYet"": false,
                        ""Sex"": ""SEX_UNKNOWN"",
                        ""useSurnameAsLead"": true,
                        ""type"": ""ADULT"",
                        ""firstName"": ""asdf"",
                        ""lastName"": ""Testing"",
                        ""title"": ""Mr"",
                        ""countryCode"": ""GBR"",
                        ""dialingCode"": ""44""
                    }
                ],
                ""browserInfo"": {
                ""acceptHeader"": ""application/json"",
                    ""userAgent"": ""Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:104.0) Gecko/20100101 Firefox/104.0"",
                    ""colourDepth"": 24,
                    ""javaEnabled"": false,
                    ""javaScriptEnabled"": true,
                    ""language"": ""en-GB"",
                    ""screenHeight"": 1080,
                    ""screenWidth"": 1920,
                    ""timeZoneOffset"": 0
                },
                ""paymentInfo"": {},
                ""deviceId"": ""8cc825e0-3a1d-ae62-8939-bd0456bc0032""
            }", Encoding.UTF8, "application/json");

        // Act
        var response = await Client.PostAsync("/api/v1/booking/commit", requestContent);
        var content = await response.Content.ReadAsStringAsync();

        // Assert
        response.StatusCode.Should().Be(
            HttpStatusCode.BadRequest,
            "because without VALID PaymentInfo AND AgentCredentials, this is a bad request."
        );
        content.Should().Contain(
            ApiExceptionCodes.BookingPaymentInfoError.Code,
            "because without AgentCredentials the PaymentInfo object is subject to validation, which fails because it is empty."
        );
    }

    [Trait("Api", "/api/v1.0/booking/commit")]
    [Trait("Category", "Component")]
    [Fact]
    public async Task CommitBooking_PaymentValidationFails_PaymentInfoInvalid()
    {
        // Arrange
        var requestContent = new StringContent(@"
            {
                ""offer"": {},
                ""leadPassenger"": {
                    ""email"": ""GluecklichPraechtigerHund@oida.icu"",
                    ""dateOfBirth"": ""1989-07-10"",
                    ""address"": ""asdfstreet 123"",
                    ""address2"": null,
                    ""townCity"": ""testville"",
                    ""postCode"": ""108"",
                    ""phone"": ""123141241"",
                    ""dialingCode"": ""44"",
                    ""countryCode"": ""GBR""
                },
                ""guests"": [
                    {
                        ""id"": ""70260f9c-6fac-e49a-e0f0-ab890002cdca"",
                        ""holydayStartDate"": ""2023-06-07T16:25:00.000Z"",
                        ""isLead"": true,
                        ""age"": 30,
                        ""notBornYet"": false,
                        ""Sex"": ""SEX_UNKNOWN"",
                        ""useSurnameAsLead"": false,
                        ""type"": ""ADULT"",
                        ""firstName"": ""Tester"",
                        ""lastName"": ""Testing"",
                        ""title"": ""MR"",
                        ""countryCode"": ""GBR"",
                        ""address"": ""asdfstreet 123"",
                        ""address2"": """",
                        ""city"": ""testville"",
                        ""postCode"": ""108"",
                        ""email"": ""GluecklichPraechtigerHund@oida.icu"",
                        ""dialingCode"": ""44"",
                        ""phone"": ""123141241"",
                        ""dateOfBirth"": ""1989-07-10""
                    },
                    {
                        ""id"": ""be98dcc6-20f5-0760-b68b-e17968289226"",
                        ""holydayStartDate"": ""2023-06-07T16:25:00.000Z"",
                        ""isLead"": false,
                        ""age"": 30,
                        ""notBornYet"": false,
                        ""Sex"": ""SEX_UNKNOWN"",
                        ""useSurnameAsLead"": true,
                        ""type"": ""ADULT"",
                        ""firstName"": ""asdf"",
                        ""lastName"": ""Testing"",
                        ""title"": ""Mr"",
                        ""countryCode"": ""GBR"",
                        ""dialingCode"": ""44""
                    }
                ],
                ""browserInfo"": {
                ""acceptHeader"": ""application/json"",
                    ""userAgent"": ""Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:104.0) Gecko/20100101 Firefox/104.0"",
                    ""colourDepth"": 24,
                    ""javaEnabled"": false,
                    ""javaScriptEnabled"": true,
                    ""language"": ""en-GB"",
                    ""screenHeight"": 1080,
                    ""screenWidth"": 1920,
                    ""timeZoneOffset"": 0
                },
                ""paymentInfo"": {
                    ""billingInfo"": {
                        ""fullName"": ""012345678901234567890123456789012345678901234567890123456789ab"",
                        ""address"": ""@@@"",
                        ""address2"": """",
                        ""city"": ""@"",
                        ""postCode"": ""1231231231231231"",
                    },
                },
                ""deviceId"": ""8cc825e0-3a1d-ae62-8939-bd0456bc0032""
            }", Encoding.UTF8, "application/json");

        // Act
        var response = await Client.PostAsync("/api/v1/booking/commit", requestContent);
        var content = await response.Content.ReadAsStringAsync();
        var responseData = JsonConvert.DeserializeObject<JObject>(content);

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.BadRequest);

        var allErrors = responseData?["innerErrors"]?.SelectMany(x => x.Children()).Select(u => u as JProperty).Select(t => t?.Value).Select(v => v?.Value<string>()).ToList();
        const string lengthErrorMessage = "The field {0} must be a string with a minimum length of {1} and a maximum length of {2}.";
        const string invalidCharactersErrorMessage = "The field {0} must not contain invalid characters.";
        allErrors!.Count.Should().Be(7);
        allErrors.Should().Contain(string.Format(invalidCharactersErrorMessage, "City"));
        allErrors.Should().Contain(string.Format(invalidCharactersErrorMessage, "Address"));
        allErrors.Should().Contain(string.Format(invalidCharactersErrorMessage, "FullName"));
        allErrors.Should().Contain(string.Format(lengthErrorMessage, "City", 2, 30));
        allErrors.Should().Contain(string.Format(lengthErrorMessage, "Address", 4, 50));
        allErrors.Should().Contain(string.Format(lengthErrorMessage, "FullName", 1, 61));
        allErrors.Should().Contain(string.Format(lengthErrorMessage, "PostCode", 2, 15));
    }

    [Trait("Api", "/api/v1.0/booking/commit")]
    [Trait("Category", "Component")]
    [Fact]
    public async Task Commit_BookingWithExtraLuggage()
    {
        var request = ComponentTestUtils.GetJsonString(
            @"WebApi\commit\commit-booking-with-extra-luggage-request.json");

        var expected = ComponentTestUtils.GetJsonString(
            @"WebApi\commit\commit-booking-with-extra-luggage-response.json", minify: true);

        // Session cookie for test@easyjet.com
        var message = new HttpRequestMessage(HttpMethod.Post, "/api/v1/booking/commit");
        message.Headers.Add(HeaderNames.Cookie, "eJ2Session=495d1c49420a43a8122d6b2f5ff1a48e162a8bd69ecd779b866bdc09574776ae&CookieTypeKey=1;");
        message.Content = ComponentTestUtils.GetJsonContent(request);

        var response = await Client.SendAsync(message);

        var content = await response.Content.ReadAsStringAsync();

        content.Should().BeEqualAfterNormalization<BookingResponse>(expected);
    }

    [Trait("Api", "/api/v1.0/booking/commit")]
    [Trait("Category", "Component")]
    [Fact]
    public async Task Commit_BookingWithSeats_ShouldReturnSuccessResponse()
    {
        // Arrange
        var request = ComponentTestUtils.GetJsonString(
            @"WebApi\commit\commit-booking-with-seats-request.json");

        var expected = ComponentTestUtils.GetJsonString(
            @"WebApi\commit\commit-booking-with-seats-response.json", minify: true);

        // Session cookie for test@easyjet.com
        var message = new HttpRequestMessage(HttpMethod.Post, "/api/v1/booking/commit");
        message.Headers.Add(HeaderNames.Cookie, "eJ2Session=495d1c49420a43a8122d6b2f5ff1a48e162a8bd69ecd779b866bdc09574776ae&CookieTypeKey=1;");
        message.Content = ComponentTestUtils.GetJsonContent(request);

        // Act
        var response = await Client.SendAsync(message);

        // Assert
        var content = await response.Content.ReadAsStringAsync();

        content.Should().BeEqualAfterNormalization<BookingResponse>(expected);
    }
}