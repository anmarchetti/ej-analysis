#nullable enable

using easyJet.Holidays.Api.Domain.Data.Common.DataAnnotations;
using Microsoft.AspNetCore.Http;
using System.ComponentModel.DataAnnotations;

namespace easyJet.Holidays.Api.Domain.Data.ContactUs;

public class ContactFormRequest
{
    [Required]
    [ContactFormValidateName]
    [StringLength(80, ErrorMessage = "The field {0} cannot contain more than 80 characters")]
    public string LeadPassengerFirstName { get; set; }

    [Required]
    [ContactFormValidateName]
    [StringLength(80, ErrorMessage = "The field {0} cannot contain more than 80 characters")]
    public string LeadPassengerLastName { get; set; }

    public string? DepartureAndReturnDate { get; set; }

    [Required]
    [StringLength(80, ErrorMessage = "The field {0} cannot contain more than 80 characters")]
    [ValidEmail]
    public string EmailAddress { get; set; }

    public string? ContactNumber { get; set; }

    public string? BookingReference { get; set; }

    public bool IsPastHoliday { get; set; }

    /// <summary>
    /// Question type
    /// </summary>
    public string? About { get; set; }

    [Required]
    [StringLength(2000, ErrorMessage = "The field {0} cannot contain more than 2000 characters")]
    public string Question { get; set; }

    [MaxLength(5, ErrorMessage = "The field {0} cannot contain more than 5 attachments")]
    [ValidContactFormRequestFiles]
    public IFormFileCollection? Attachments { get; set; }

    /// <summary>
    /// The user's CAPTCHA token
    /// </summary>
    public string? Captcha { get; set; }
}
