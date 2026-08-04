#nullable enable
using easyJet.Holidays.Api.Domain.Services.ReferenceData;
using easyJet.Holidays.Api.Domain.Settings;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Options;
using System.ComponentModel.DataAnnotations;

namespace easyJet.Holidays.Api.Domain.Data.Attributes;

/// <summary>
/// Validates file extensions, amount and size of attached files. Should be configured from
/// TradePortal:TradeAgentFeedback:AttachedFileSettings section of appsettings.json
/// </summary>
[AttributeUsage(AttributeTargets.Property | AttributeTargets.Field | AttributeTargets.Parameter)]
public sealed class ValidTradeAgentFeedbackFilesAttribute : ValidationAttribute
{
    /// <inheritdoc/>
    protected override ValidationResult? IsValid(object? value, ValidationContext validationContext)
    {
        ArgumentNullException.ThrowIfNull(validationContext);
        
        var settingsService = validationContext.GetRequiredService<IReferenceDataService>();
        AttachedFileSettings attachedFileSettings =
            settingsService.GetTradeAgentFeedbackAttachedFileSettings().GetAwaiter().GetResult();
        string[] allowedContentTypes = attachedFileSettings.AllowedFileExtensions.Split(",", StringSplitOptions.RemoveEmptyEntries);
        int maxFileSize = attachedFileSettings.MaxFileSize;
        int maxFiles = attachedFileSettings.MaxFileCount;

        var files = value as IFormFileCollection;

        if (files == null) // we don't mind if files were not been specified
        {
            return ValidationResult.Success;
        }

        if (files.Count > maxFiles)
        {
            return new ValidationResult(
                $"Maximum allowed amount of attachments for field '{validationContext.DisplayName}' is "
                + maxFiles);
        }

        foreach (var file in files)
        {
            if (file.Length > maxFileSize)
            {
                return new ValidationResult(
                    $"Each file inside field '{validationContext.DisplayName}' should have size, less, than {maxFileSize / 1_024 / 1_024}MB");
            }

            var contentType = file.ContentType;

            if (!allowedContentTypes.Contains(contentType, StringComparer.OrdinalIgnoreCase))
            {
                var extensionsString = string.Join(", ", allowedContentTypes);
                return new ValidationResult(
                    $"Each file inside field '{validationContext.DisplayName}' should have one of allowed extensions {extensionsString}");
            }
        }

        return ValidationResult.Success;
    }
}