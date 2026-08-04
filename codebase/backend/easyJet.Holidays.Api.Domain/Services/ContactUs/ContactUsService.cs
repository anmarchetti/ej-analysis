#nullable enable
using easyJet.Holidays.Api.Domain.Data.ContactUs;
using easyJet.Holidays.Api.Domain.Interfaces.ContactUs;
using easyJet.Holidays.Api.Domain.Interfaces.Salesforce;
using easyJet.Holidays.Api.Domain.Services.Language;
using easyJet.Holidays.Api.Domain.Services.ReferenceData;
using easyJet.Holidays.Api.Domain.Settings;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

namespace easyJet.Holidays.Api.Domain.Services.ContactUs;

/// <inheritdoc cref="IContactUsService"/>
public class ContactUsService : IContactUsService
{
    private readonly ISalesforceService _salesforceService;
    private readonly ILanguageService _languageService;
    private readonly ContactUsSettings _contactUsSettings;
    private readonly IReferenceDataService _referenceDataService;
    private readonly ILogger<ContactUsService> _logger;

    /// <summary>
    /// standard ctor
    /// </summary>
    /// <param name="salesforceService"></param>
    /// <param name="languageService"></param>
    /// <param name="contactUsSettings"></param>
    /// <param name="logger"></param>
    /// <param name="referenceDataService"></param>
    public ContactUsService(ISalesforceService salesforceService,
        ILanguageService languageService, IOptions<ContactUsSettings> contactUsSettings, ILogger<ContactUsService> logger, IReferenceDataService referenceDataService)
    {
        _salesforceService = salesforceService;
        _languageService = languageService;
        _contactUsSettings = contactUsSettings.Value;
        _referenceDataService = referenceDataService;
        _logger = logger;
    }


    /// <inheritdoc />
    public async Task<ContactUsResult> CreateCase(ContactFormRequest contactFormRequest)
    {
        ArgumentNullException.ThrowIfNull(contactFormRequest);
        
        var curLang = _languageService.GetCurrentLanguage();
        var caseType = await GetCaseType(contactFormRequest);

        if (caseType is null)
        {
            _logger.LogError("Cannot find case type for question of type '{About}'", contactFormRequest.About);
            return new ContactUsResult { IsSuccessful = false };
        }

        if (caseType.SendTo == ContactUsSendTo.Salesforce)
        {
            return await _salesforceService.SendContacUsFormRequest(contactFormRequest, caseType.SalesforceCategory,
                curLang);
        }

        _logger.LogError("Unknown destination for case of type '{About}' - '{Destination}'", contactFormRequest.About, caseType.SendTo);
        return new ContactUsResult { IsSuccessful = false };
    }
    
    internal async Task<QuestionCaseTypeMapping?> GetCaseType(ContactFormRequest contactFormRequest)
    {
        var caseTypes = await _referenceDataService.GetContactUsCaseTypes();
        var children = caseTypes.Children ?? [];
        QuestionCaseTypeMapping? fallbackCaseType = null;
        foreach (var child in children)
        {
            // Find the right case type
            if (child.Question == contactFormRequest.About 
                && child.State == (contactFormRequest.IsPastHoliday ? _contactUsSettings.PastBookingState : _contactUsSettings.FutureBookingState))
            {
                return child;
            }
            // Remember fallback (in case BookingReference is null)
            if (fallbackCaseType is null && string.IsNullOrEmpty(child.Question))
            {
                fallbackCaseType = child;
            }
        }
        // Return the fallback only if BookingReference is null.
        return contactFormRequest.BookingReference is null ? fallbackCaseType : null;
    }
}
