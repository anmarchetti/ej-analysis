using easyJet.Holidays.Api.Common.Exceptions;
using easyJet.Holidays.Api.Domain.Data.Authentication;
using easyJet.Holidays.Api.Domain.Services;
using easyJet.Holidays.Api.Domain.Services.Authentication;
using easyJet.Holidays.Api.Domain.Services.Language;
using easyJet.Holidays.Api.Domain.Services.ReferenceData;
using easyJet.Holidays.Api.Domain.Settings;
using easyJet.Holidays.Api.Domain.Utils;
using easyJet.Holidays.External.B2B.Exceptions;
using easyJet.Holidays.External.B2B.Models.AddMember;
using easyJet.Holidays.External.B2B.Models.GetMemberDetails;
using easyJet.Holidays.External.B2B.Models.ResetPassword;
using easyJet.Holidays.External.Domain.Api;
using easyJet.Holidays.External.Domain.Extensions;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using System.Globalization;
using System.Security.Cryptography;

namespace easyJet.Holidays.External.B2B.Services
{
    public class B2BMembersService : ICustomerProvider
    {
        private const string YesLabel = "Y";
        private static readonly string DummyPassword = $"Qwerty_123_{GetDummyPassword()}";// unique random password

        private readonly IApiService _apiService;
        private readonly B2BSettings _b2BSettings;
        private readonly EndpointsProvider _endpointsProvider;
        private readonly IHttpContextAccessor _httpContextAccessor;
        private readonly ILogger<B2BMembersService> _logger;
        private readonly IReferenceDataService _referenceDataService;
        private readonly ILanguageService _languageService;


        public B2BMembersService(
            IApiService apiService,
            IOptions<B2BSettings> b2BSettings,
            EndpointsProvider endpointsProvider,
            IHttpContextAccessor httpContextAccessor,
            IReferenceDataService referenceDataService,
            ILogger<B2BMembersService> logger,
            ILanguageService languageService)
        {
            _b2BSettings = b2BSettings.Value ?? throw new ArgumentNullException(nameof(b2BSettings));
            _apiService = apiService;
            _endpointsProvider = endpointsProvider;
            _httpContextAccessor = httpContextAccessor;
            _logger = logger;
            _referenceDataService = referenceDataService;
            _languageService = languageService;
        }

        /// <inheritdoc />
        public async Task<CustomerDetails> GetDetails(CustomerCredentials creds)
        {
            var response = await SendCustomerDetailsRequest(creds.Username, creds.Password);
            var member = response?.Payload?.Body?.DataListRoot?.MemberDetails?.Member;

            if (member == null)
            {
                return null;
            }


            var countryCode = "";
            if (!String.IsNullOrEmpty(member.Country))
            {
                var countries = await _referenceDataService.GetB2BCountries();

                if (countries != null && countries.Count > 0)
                {
                    var encodedCountry = member.Country.Replace("&", "And");
                    var countryToReturn = countries.FirstOrDefault(c => c.CountryName == member.Country || c.CountryName == encodedCountry);
                    if (countryToReturn != null)
                    {
                        countryCode = countryToReturn.IsoCountryCodeAlpha;
                    }
                }
            }

            DateTimeOffset? birthDate = null;

            if (member.BirthDate != null)
            {
                if (DateTimeOffset.TryParse(member.BirthDate, null, DateTimeStyles.AssumeUniversal, out var birthDateResult))
                {
                    birthDate = birthDateResult;
                }

            }

            var phone = member.MobilePhone?.Split(' ') ?? new string[0];
            var dialingCode = "";
            var mobilePhone = "";

            if (phone.Length > 1)
            {
                dialingCode = (phone[0] ?? "").Replace("+", "");
                mobilePhone = phone[1];
            }
            else
            {
                mobilePhone = member.MobilePhone;
            }

            return new CustomerDetails
            {
                Id = member.EncryptedMemberID,
                Title = member.Title?.Trim(),
                Email = member.MemberEmailAddress,
                FirstName = member.FirstName,
                LastName = member.LastName,
                DialingCode = dialingCode,
                MobilePhone = mobilePhone,
                BirthDate = birthDate,
                Address1 = member.Address1,
                Address2 = member.Address2,
                City = member.City,
                PostalCode = member.PostalCode,
                easyJetMailingsFlag = YesLabel == member.easyJetMailingsFlag,
                MailingsFlag = YesLabel == member.MailingsFlag,
                CountryCode = countryCode,
            };
        }

        /// <inheritdoc />
        /// Use GetMemberDetails with dumy password and analyzie error codes to decide whether account exists or not
        public async Task<bool> CustomerExists(string email)
        {
            try
            {
                await SendCustomerDetailsRequest(email, DummyPassword);
            }
            catch (ApiException ex)
            {
                var error = ex.InnerErrors?.FirstOrDefault();
                if (error == null)
                {
                    // We shouldn't be here because we sent Dummy password and B2B SHOULD return at least one error.
                    // But we got error and we can't ignore it
                    _logger.LogError("No inner error in error response from B2B GetMemberDetails request. Email: {Email}", email);
                    // But if we manage to get successful response assume account exists
                    return false;
                }

                var emailExistsErrors = new[] {
                    KnownErrorCodes.MemberPasswordIncorrect.Code,
                    KnownErrorCodes.MemberAccountLocked.Code,
                };

                if (emailExistsErrors.Contains(error.Code))
                {
                    return true;
                }

                return false;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Unexpected error checking if customer exists");
                return false;
            }

            // We shouldn't be here because we sent Dummy password and B2B SHOULD return at least one error
            _logger.LogError("No error from B2B GetMemberDetails request. Email: {Email}", email);
            // If we somehow manage to get here then assume the account exists
            return true;
        }

        /// <inheritdoc />
        public async Task ResetPassword(string email)
        {
            var request = new ResetPasswordRequest();
            var currentLanguage = _languageService.GetCurrentLanguage();
            request.Payload.Body = new ResetPasswordRequestBody(_b2BSettings)
            {
                MemberEmailAddress = email,
                CultureCode = LanguageParseUtils.MapToCultureCode(currentLanguage),
                LanguageCode = LanguageParseUtils.MapToLanguageCode(currentLanguage)
            };

            request.Endpoint = _endpointsProvider.GetEndpoint(B2BEndpoint.MyService, _httpContextAccessor.HttpContext.Request.Cookies);

            await _apiService.GetResponseContentAsyncWithErrorMapping<ResetPasswordRequest, ResetPasswordResponse>
                (request, ApiExceptionCodes.AuthCustomerregistrationError);
        }

        /// <inheritdoc />
        public async Task Create(CustomerDetails customer, string password)
        {
            await ValidatePassword(password);

            var request = new AddMemberRequest();
            var mobilePhone = customer.MobilePhone.Replace(" ", "");
            var dialingCode = $"+{customer.DialingCode.Replace(" + ", "")}";
            var currentLanguage = _languageService.GetCurrentLanguage();
            request.Payload.Body = new AddMemberRequestBody(_b2BSettings)
            {
                MemberData = new MemberDataRequestBody
                {
                    LanguageCode = LanguageParseUtils.MapToLanguageCode(currentLanguage),
                    CultureCode = LanguageParseUtils.MapToCultureCode(currentLanguage),
                    ISOCountryCode = customer.CountryCode,
                    EmailAddress = customer.Email,
                    Password = password,
                    TitleTypeCode = customer.Title,
                    FirstName = customer.FirstName,
                    LastName = customer.LastName,
                    Address1 = customer.Address1,
                    Address2 = customer.Address2,
                    City = customer.City,
                    PostalCode = customer.PostalCode,
                    MobilePhone = $"{dialingCode} {mobilePhone}",
                    OptInForEasyJetMailing = customer.easyJetMailingsFlag ? "True" : "False",
                    OptInForMailing = customer.MailingsFlag ? "True" : "False",
                    BirthDate = DateFormatUtils.DateOnly(customer.BirthDate?.Date),
                    PreferredAirportOne = customer.PreferredAirports?.TryGet(0),
                    PreferredAirportTwo = customer.PreferredAirports?.TryGet(1),
                    PreferredAirportThree = customer.PreferredAirports?.TryGet(2),
                }
            };
            request.Endpoint = _endpointsProvider.GetEndpoint(B2BEndpoint.MyService, _httpContextAccessor.HttpContext.Request.Cookies);

            await _apiService.GetResponseContentAsyncWithErrorMapping<AddMemberRequest, AddMemberResponse>
                (request, ApiExceptionCodes.AuthCustomerregistrationError);
        }
        
        private async Task ValidatePassword(string password)
        {
            var customerDetailsFormSettings = await _referenceDataService.GetCustomerDetailsFormSettings();
            if (customerDetailsFormSettings.PasswordProhibitedWords.Contains(password))
                throw new Exception("Password contains prohibited words");
        }

        private Task<GetMemberDetailsResponse> SendCustomerDetailsRequest(string email, string password)
        {
            var request = new GetMemberDetailsRequest();
            request.Payload.Body = new GetMemberDetailsRequestBody(_b2BSettings)
            {
                ShowEncryptedMemberId = true,
                MemberEmailAddress = email,
                MemberPassword = password
            };
            request.Endpoint = _endpointsProvider.GetEndpoint(B2BEndpoint.MyService, _httpContextAccessor.HttpContext.Request.Cookies);

            return _apiService.GetResponseContentAsyncWithErrorMapping<GetMemberDetailsRequest, GetMemberDetailsResponse>
                (request, ApiExceptionCodes.AuthCustomerLoginError);
        }

        private static string GetDummyPassword()
        {
            var randomGenerator = RandomNumberGenerator.Create(); // Compliant for security-sensitive use cases
            byte[] data = new byte[16];
            randomGenerator.GetBytes(data);
            return BitConverter.ToString(data);
        }
    }
}
