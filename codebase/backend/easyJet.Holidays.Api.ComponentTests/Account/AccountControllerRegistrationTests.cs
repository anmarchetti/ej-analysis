using easyJet.Holidays.Api.Common.Exceptions;
using easyJet.Holidays.Api.ComponentTests.Infrastructure;
using easyJet.Holidays.Api.Controllers;
using easyJet.Holidays.Tests.Domain;
using easyJet.Holidays.Tests.Domain.ComponentTests;
using FluentAssertions;
using Newtonsoft.Json;
using System.Net;
using System.Text;
using Xunit;

namespace easyJet.Holidays.Api.ComponentTests.Account;

/// <summary>
/// Component tests for <see cref="AccountController"/>
/// </summary>
public class AccountControllerRegistrationTests : BaseFixtureAwareComponentTest
{
    public AccountControllerRegistrationTests(WebApplicationFixture webApp) : base(webApp)
    {
    }

    private static string GetString(int length) => string.Concat(Enumerable.Range(0, length).Select(_ => 'a'));
    public static IEnumerable<object[]> ValidateTestData()
    {
        var validCustomer = new
        {
            title = "MR",
            email = "new@easyjet.com",
            firstName = "Test",
            lastName = "Test",
            dialingCode = "079",
            mobilePhone = "99999999",
            birthDate = "1950-01-01",
            address1 = "The Hay Barn",
            address2 = "Londonderry Farm",
            city = "Bristol",
            postalCode = "BS306EL",
            countryCode = "GBR",
            mailingsFlag = true,
            easyJetMailingsFlag = false,
        };

        yield return new object[] {
            "Valid data",
            new {
                password = "Qwerty_0000",
                rememberMe = false,
                customer = validCustomer
            },
            HttpStatusCode.OK
        };

        yield return new object[] {
            "Invalid password: too short",
            new {
                password = "short",
                rememberMe = false,
                customer = validCustomer
            },
            HttpStatusCode.BadRequest
        };

        yield return new object[] {
            "Invalid password: special characters",
            new {
                password = "Qwerty_0 #&",
                rememberMe = false,
                customer = validCustomer
            },
            HttpStatusCode.BadRequest
        };

        yield return new object[] {
            "Invalid title",
            new {
                password = "Qwerty_0000",
                rememberMe = false,
                customer = ObjectUtils.Merge(validCustomer, new {
                    title = "Mrr"
                })
            },
            HttpStatusCode.BadRequest
        };

        yield return new object[] {
            "Valid title: ignore case",
            new {
                password = "Qwerty_0000",
                rememberMe = false,
                customer = ObjectUtils.Merge(validCustomer, new {
                    title = "mr"
                })
            },
            HttpStatusCode.OK
        };


        yield return new object[] {
            "Invalid email",
            new {
                password = "Qwerty_0000",
                rememberMe = false,
                customer = ObjectUtils.Merge(validCustomer, new {
                    email = "invalid_email"
                })
            },
            HttpStatusCode.BadRequest
        };

        yield return new object[] {
            "Invalid firstName",
            new {
                password = "Qwerty_0000",
                rememberMe = false,
                customer = ObjectUtils.Merge(validCustomer, new {
                    firstName = ""
                })
            },
            HttpStatusCode.BadRequest
        };

        yield return new object[] {
            "Invalid lastName",
            new {
                password = "Qwerty_0000",
                rememberMe = false,
                customer = ObjectUtils.Merge(validCustomer, new {
                    lastName = ""
                })
            },
            HttpStatusCode.BadRequest
        };

        yield return new object[] {
            "Invalid mobilePhone",
            new {
                password = "Qwerty_0000",
                rememberMe = false,
                customer = ObjectUtils.Merge(validCustomer, new {
                    mobilePhone = "mobile"
                })
            },
            HttpStatusCode.BadRequest
        };

        yield return new object[] {
            "Invalid birthDate",
            new {
                password = "Qwerty_0000",
                rememberMe = false,
                customer = ObjectUtils.Merge(validCustomer, new {
                    birthDate = "1900000-xx"
                })
            },
            HttpStatusCode.BadRequest
        };

        yield return new object[] {
            "Invalid address1: Too short",
            new {
                password = "Qwerty_0000",
                rememberMe = false,
                customer = ObjectUtils.Merge(validCustomer, new {
                    address1 = GetString(3),
                })
            },
            HttpStatusCode.BadRequest
        };

        yield return new object[] {
            "Invalid address1: Too long",
            new {
                password = "Qwerty_0000",
                rememberMe = false,
                customer = ObjectUtils.Merge(validCustomer, new {
                    address1 = GetString(51),
                })
            },
            HttpStatusCode.BadRequest
        };

        yield return new object[] {
            "Valid address2: Can be null",
            new {
                password = "Qwerty_0000",
                rememberMe = false,
                customer = ObjectUtils.Merge(validCustomer, new {
                    address2 = default(string),
                })
            },
            HttpStatusCode.OK
        };

        yield return new object[] {
            "Invalid city: Too short",
            new {
                password = "Qwerty_0000",
                rememberMe = false,
                customer = ObjectUtils.Merge(validCustomer, new {
                    city = GetString(1),
                })
            },
            HttpStatusCode.BadRequest
        };

        yield return new object[] {
            "Invalid city: Too long",
            new {
                password = "Qwerty_0000",
                rememberMe = false,
                customer = ObjectUtils.Merge(validCustomer, new {
                    city = GetString(31),
                })
            },
            HttpStatusCode.BadRequest
        };

        yield return new object[] {
            "Invalid postalCode: Too short",
            new {
                password = "Qwerty_0000",
                rememberMe = false,
                customer = ObjectUtils.Merge(validCustomer, new {
                    postalCode = GetString(1),
                })
            },
            HttpStatusCode.BadRequest
        };

        yield return new object[] {
            "Invalid postalCode: Too long",
            new {
                password = "Qwerty_0000",
                rememberMe = false,
                customer = ObjectUtils.Merge(validCustomer, new {
                    postalCode = GetString(16),
                })
            },
            HttpStatusCode.BadRequest
        };

        yield return new object[] {
            "Invalid mailingsFlag",
            new {
                password = "Qwerty_0000",
                rememberMe = false,
                customer = ObjectUtils.Merge(validCustomer, new {
                    mailingsFlag = "truuu"
                })
            },
            HttpStatusCode.BadRequest
        };

        yield return new object[] {
            "Invalid easyJetMailingsFlag",
            new {
                password = "Qwerty_0000",
                rememberMe = false,
                customer = ObjectUtils.Merge(validCustomer, new {
                    easyJetMailingsFlag = "falseee"
                })
            },
            HttpStatusCode.BadRequest
        };

        yield return new object[] {
            "Maximum 3 airports",
            new {
                password = "Qwerty_0",
                rememberMe = false,
                customer = ObjectUtils.Merge(validCustomer, new {
                    preferredAirports = new List<string> {"LGW", "GWW", "QQ", "WWW" }
                })
            },
            HttpStatusCode.BadRequest
        };

        yield return new object[] {
            "Airport code maximum 3 characters",
            new {
                password = "Qwerty_0",
                rememberMe = false,
                customer = ObjectUtils.Merge(validCustomer, new {
                    preferredAirports = new List<string> {"LGW", "GWWWW"}
                })
            },
            HttpStatusCode.BadRequest
        };
    }

    [Trait("Category", "Component")]
    [Trait("Api", "/api/v1.0/account")]
    [Theory]
    [MemberData(nameof(ValidateTestData))]
    public async Task Registration_ValidateRequest(string because, object requestBody, HttpStatusCode status)
    {
        // Arrange 
        var query = $"/api/v1.0/account";
        var body = JsonConvert.SerializeObject(requestBody);

        // Act
        var response = await Client.PostAsync(query, new StringContent(body, Encoding.UTF8, "application/json"));

        // Assert            
        response.StatusCode.Should().Be(status, because);
    }

    [Trait("Category", "Component")]
    [Trait("Api", "/api/v1.0/account")]
    [Fact]
    public async Task Registration_Successs_ShouldReturnDetailsAndLogin()
    {
        // Arrange 
        var expectedCustomer = new
        {
            title = "MR",
            email = "new@easyjet.com",
            firstName = "Test",
            lastName = "Test",
            dialingCode = "079",
            mobilePhone = "99999999",
            birthDate = "1950-01-01T00:00:00+00:00",
            address1 = "The Hay Barn",
            address2 = "Londonderry Farm",
            city = "Bristol",
            postalCode = "BS306EL",
            countryCode = "GBR",
            mailingsFlag = true,
            easyJetMailingsFlag = false
        };

        var requestBody = new
        {
            password = "Qwerty_0000",
            rememberMe = false,
            customer = ObjectUtils.Merge(expectedCustomer, new
            {
                birthDate = "1950-01-01"
            })
        };

        var query = $"/api/v1.0/account";
        var body = JsonConvert.SerializeObject(requestBody);

        // Act
        var response = await Client.PostAsync(query, new StringContent(body, Encoding.UTF8, "application/json"));
        var content = await response.Content.ReadAsStringAsync();
        var responseData = JsonConvert.DeserializeAnonymousType(content, expectedCustomer);

        var cookies = response.Headers.GetValues("Set-Cookie");
        var eJ2SessionCookie = cookies.FirstOrDefault(x => x.Contains("eJ2Session="));

        // Assert            
        responseData.Should().Be(expectedCustomer);
        eJ2SessionCookie.Should().NotBeNullOrWhiteSpace();
    }

    [Trait("Category", "Component")]
    [Trait("Api", "/api/v1.0/account")]
    [Fact]
    public async Task Registration_Error_ReturnErrors()
    {
        // Arrange 
        var requestBody = new
        {
            password = "Qwerty_0000",
            rememberMe = false,
            customer = new
            {
                title = "MR",
                email = "alreadyregistered@easyjet.com",
                firstName = "Test",
                lastName = "Test",
                dialingCode = "079",
                mobilePhone = "99999999",
                birthDate = "1950-01-01",
                address1 = "The Hay Barn",
                address2 = "Londonderry Farm",
                city = "Bristol",
                postalCode = "BS306EL",
                countryCode = "GBR",
                mailingsFlag = true,
                easyJetMailingsFlag = false
            }
        };

        var query = $"/api/v1.0/account";
        var body = JsonConvert.SerializeObject(requestBody);

        // Act
        var response = await Client.PostAsync(query, new StringContent(body, Encoding.UTF8, "application/json"));

        var content = await response.Content.ReadAsStringAsync();
        var responseType = new { error = "", code = "" };
        var responseData = JsonConvert.DeserializeAnonymousType(content, responseType);

        // Assert            
        response.StatusCode.Should().Be(HttpStatusCode.BadRequest);
        responseData!.error.Should().Be(ApiExceptionCodes.AuthCustomerregistrationError.Description);
        responseData.code.Should().Be(ApiExceptionCodes.AuthCustomerregistrationError.Code);
    }
}