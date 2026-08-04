using System;
using System.Collections.Generic;
using System.Linq;
using easyJet.Feature.SitecoreEnhancment.Utils;
using easyJet.Foundation.Presentation.Models;
using Sitecore.Data;
using Sitecore.Data.Fields;

namespace easyJet.Feature.SitecoreEnhancment.Fields
{
    /// <summary>
    ///     Strongly-typed wrapper for the RenderingMappingList custom field type.
    ///     Provides type-safe access to item mapping data stored as keyId:valueId:parameters|...
    /// </summary>
    public class RenderingMappingField : CustomField
    {
        /// <summary>
        ///     Initializes a new instance of the <see cref="RenderingMappingField" /> class.
        /// </summary>
        /// <param name="field">The underlying Sitecore field.</param>
        public RenderingMappingField(Field field)
            : base(field)
        {
        }

        /// <summary>
        ///     Gets all mappings from the field value.
        /// </summary>
        /// <returns>A list of item mappings.</returns>
        public List<RenderingMapping> GetMappings()
        {
            var mappings = new List<RenderingMapping>();
            var value = InnerField?.Value;

            if (string.IsNullOrWhiteSpace(value))
            {
                return mappings;
            }

            var entries = value.Split(new[] { '|' }, StringSplitOptions.RemoveEmptyEntries);
            foreach (var entry in entries)
            {
                var mapping = ParseMapping(entry);
                if (mapping != null && mapping.IsValid)
                {
                    mappings.Add(mapping);
                }
            }

            return mappings;
        }

        /// <summary>
        ///     Sets the mappings for this field.
        /// </summary>
        /// <param name="mappings">The list of mappings to set.</param>
        public void SetMappings(List<RenderingMapping> mappings)
        {
            if (mappings == null || mappings.Count == 0)
            {
                Value = string.Empty;
                return;
            }

            var validMappings = mappings
                .Where(m => m != null && m.IsValid)
                .Select(m =>
                {
                    var valueStr = m.IsJustRemove ? Constants.RenderingMappingEditor.JustRemoveValue : m.ValueId.ToString();
                    return m.Uid != Guid.Empty
                        ? $"{m.KeyId}:{valueStr}:{RenderingMappingValueEscaper.EscapeValue(m.Parameters)}:{m.Uid:B}"
                        : $"{m.KeyId}:{valueStr}:{RenderingMappingValueEscaper.EscapeValue(m.Parameters)}";
                });

            Value = string.Join("|", validMappings);
        }

        /// <summary>
        ///     Parses a single mapping entry from string format.
        /// </summary>
        /// <param name="entry">The entry string in format keyId:valueId:parameters.</param>
        /// <returns>An ItemMapping instance, or null if parsing fails.</returns>
        private static RenderingMapping ParseMapping(string entry)
        {
            if (string.IsNullOrWhiteSpace(entry))
            {
                return null;
            }

            var parts = entry.Split(new[] { ':' }, 4); // Split into max 4 parts: keyId:valueId:parameters:uid
            if (parts.Length < 2)
            {
                return null;
            }

            if (!ID.TryParse(parts[0], out var keyId))
            {
                return null;
            }

            var rawValuePart = parts[1];
            var isJustRemove = rawValuePart == Constants.RenderingMappingEditor.JustRemoveValue;
            ID.TryParse(isJustRemove ? string.Empty : rawValuePart, out var valueId);
            var parameters = parts.Length > 2 ? RenderingMappingValueEscaper.UnescapeValue(parts[2]) : string.Empty;
            Guid.TryParse(parts.Length > 3 ? parts[3] : string.Empty, out var uid);

            return new RenderingMapping(keyId, valueId, parameters, uid, isJustRemove);
        }

        /// <summary>
        ///     Implicit conversion from Field to RenderingMappingField.
        /// </summary>
        /// <param name="field">The field to convert.</param>
        public static implicit operator RenderingMappingField(Field field)
        {
            return field != null ? new RenderingMappingField(field) : null;
        }
    }
}