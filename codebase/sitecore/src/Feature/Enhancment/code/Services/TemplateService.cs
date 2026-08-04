using System;
using System.Collections.Generic;
using System.Collections.Specialized;
using System.Linq;
using easyJet.Feature.SitecoreEnhancment.Logging;
using easyJet.Foundation.DependencyInjection;
using easyJet.Foundation.DependencyInjection.Attributes;
using Sitecore.Data;
using Sitecore.Data.Items;

namespace easyJet.Feature.SitecoreEnhancment.Services
{
    [Service(typeof(ITemplateService), Lifetime = Lifetime.Singleton)]
    /// <summary>
    /// Default implementation of template operations.
    /// </summary>
    public class TemplateService : ITemplateService
    {
        private readonly IRenderingMappingLogger logger;

        /// <summary>
        /// Initializes a new instance of the <see cref="TemplateService"/> class.
        /// </summary>
        public TemplateService()
            : this(new RenderingMappingLogger())
        {
        }

        /// <summary>
        /// Initializes a new instance of the <see cref="TemplateService"/> class.
        /// </summary>
        /// <param name="logger">The logger instance.</param>
        public TemplateService(IRenderingMappingLogger logger)
        {
            this.logger = logger ?? new RenderingMappingLogger();
        }

        /// <inheritdoc/>
        public IEnumerable<string> GetFieldNames(Item templateItem)
        {
            if (templateItem == null)
            {
                return Enumerable.Empty<string>();
            }

            try
            {
                var template = new TemplateItem(templateItem);
                return template.GetSections()
                    .SelectMany(section => section.GetFields())
                    .Where(field => !string.IsNullOrEmpty(field.Name) && !field.Name.StartsWith("__"))
                    .Select(field => field.Name)
                    .ToList();
            }
            catch (Exception ex)
            {
                logger.Warn("Failed to get field names from template.", ex, this);
                return Enumerable.Empty<string>();
            }
        }

        /// <inheritdoc/>
        public IDictionary<ID, string> GetFieldIdToNameMap(Item templateItem)
        {
            var map = new Dictionary<ID, string>();

            if (templateItem == null)
            {
                return map;
            }

            try
            {
                var template = new TemplateItem(templateItem);
                var fields = template.GetSections()
                    .SelectMany(section => section.GetFields())
                    .Where(field => !field.Name.StartsWith("__"));

                foreach (var field in fields)
                {
                    map[field.ID] = field.Name;
                }
            }
            catch (Exception ex)
            {
                logger.Warn("Failed to build field ID to name map.", ex, this);
            }

            return map;
        }

        /// <inheritdoc/>
        public Item GetStandardValuesItem(Item templateItem)
        {
            if (templateItem == null)
            {
                return null;
            }

            try
            {
                var template = new TemplateItem(templateItem);
                return template.StandardValues;
            }
            catch (Exception ex)
            {
                logger.Warn("Failed to get standard values item.", ex, this);
                return null;
            }
        }

        /// <inheritdoc/>
        public IEnumerable<FieldDescriptorInfo> BuildFieldDescriptors(
            Item templateItem,
            NameValueCollection parsedParams,
            HashSet<string> addedFields)
        {
            if (templateItem == null)
            {
                yield break;
            }

            TemplateItem template;
            try
            {
                template = new TemplateItem(templateItem);
            }
            catch (Exception ex)
            {
                logger.Warn("Failed to create TemplateItem.", ex, this);
                yield break;
            }

            var standardValuesItem = GetStandardValuesItem(templateItem);
            var contextItem = standardValuesItem ?? templateItem;

            IEnumerable<object> sections;
            try
            {
                var raw = template.GetSections();
                sections = raw ?? Enumerable.Empty<object>();
            }
            catch (Exception ex)
            {
                logger.Warn("Failed iterating template sections.", ex, this);
                yield break;
            }

            foreach (var section in sections)
            {
                IEnumerable<object> fields;
                try
                {
                    var rawFields = ((dynamic)section).GetFields();
                    fields = (rawFields as System.Collections.IEnumerable)?.Cast<object>() ?? Enumerable.Empty<object>();
                }
                catch (Exception ex)
                {
                    logger.Warn("Failed getting fields from template section.", ex, this);
                    continue;
                }

                foreach (var fieldObj in fields)
                {
                    string fieldName;
                    try
                    {
                        fieldName = (string)((dynamic)fieldObj).Name;
                    }
                    catch (Exception ex)
                    {
                        logger.Warn("Failed reading field name from template field object.", ex, this);
                        continue;
                    }

                    if (string.IsNullOrEmpty(fieldName) || fieldName.StartsWith("__") || !addedFields.Add(fieldName))
                    {
                        continue;
                    }

                    var hasCurrent = !string.IsNullOrEmpty(parsedParams?[fieldName]);
                    var value = GetFieldValue(parsedParams, fieldName, standardValuesItem);

                    yield return new FieldDescriptorInfo
                    {
                        FieldName = fieldName,
                        Value = value,
                        ContainsStandardValue = !hasCurrent,
                        ContextItem = contextItem
                    };
                }
            }
        }

        private static string GetFieldValue(NameValueCollection parsedParams, string fieldName, Item standardValuesItem)
        {
            var current = parsedParams?[fieldName];
            if (!string.IsNullOrEmpty(current))
            {
                return current;
            }

            if (standardValuesItem != null)
            {
                var stdValField = standardValuesItem.Fields[fieldName];
                return stdValField?.Value ?? string.Empty;
            }

            return string.Empty;
        }
    }
}