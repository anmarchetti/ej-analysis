#nullable enable
#pragma warning disable CA1062
using easyJet.Holidays.Api.Domain.Settings;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Options;
using System.ComponentModel.DataAnnotations;

namespace easyJet.Holidays.Api.Domain.Data.ContactUs;

/// <summary>
/// Validates file extensions, amount and size of attached files. Should be configured from
/// TradePortal:TradeAgentFeedback:AttachedFileSettings section of appsettings.json
/// </summary>
[AttributeUsage(AttributeTargets.Property | AttributeTargets.Field | AttributeTargets.Parameter)]
public sealed class ValidContactFormRequestFilesAttribute : ValidationAttribute
{
    /// <inheritdoc/>
    protected override ValidationResult? IsValid(object? value, ValidationContext validationContext)
    {
        var settings = validationContext.GetService(typeof(IOptions<ContactUsSettings>)) as IOptions<ContactUsSettings>;
        if (settings == null) // this should happen only when there is no such entry inside config
        {
            throw new InvalidOperationException("Fatal error. Cannot obtain ContactUsSettings object");
        }

        if (value is not IFormFileCollection files)
        {
            return ValidationResult.Success;
        }

        long combinedFileSizeInBytes = 0;
        var fileExtensions = settings.Value.RequestFormAttachmentAllowedExtensions;
        foreach (var file in files)
        {
            var extension = Path.GetExtension(file.FileName);
            if (!fileExtensions.Contains(extension, StringComparer.OrdinalIgnoreCase))
            {
                var extensionsString = string.Join(", ", fileExtensions);
                return new ValidationResult($"Each file inside field '{validationContext.DisplayName}' should have one of allowed extensions {extensionsString}");
            }

            combinedFileSizeInBytes += file.Length;
        }

        if (combinedFileSizeInBytes > settings.Value.RequestFormAttachmentMaxSizeOfAllFiles)
        {
            return new ValidationResult($"Maximum allowed upload size for field '{validationContext.DisplayName}' is less than {settings.Value.RequestFormAttachmentMaxSizeOfAllFiles / 1_000_000}MB");
        }

        return ValidationResult.Success;
    }
}