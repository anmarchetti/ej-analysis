using System;
using Sitecore.Data;

namespace easyJet.Foundation.Analytics.Models.Profiles
{
    public class TagChildrenSettings
    {
        public TagChildrenSettings()
        {
            TagChildren = false;
            TemplatesId = Array.Empty<ID>();
        }

        public TagChildrenSettings(bool tagChildren, ID[] templatesId)
        {
            TagChildren = tagChildren;
            TemplatesId = templatesId ?? Array.Empty<ID>();
        }

        public bool TagChildren { get; set; }

        public ID[] TemplatesId { get; set; }
    }
}