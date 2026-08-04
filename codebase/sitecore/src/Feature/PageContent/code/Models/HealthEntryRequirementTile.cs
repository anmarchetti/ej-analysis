using easyJet.Foundation.Destinations.Models.Domain;
using easyJet.Foundation.SitecoreExtensions.Extensions;
using Sitecore.Data.Fields;
using Sitecore.Data.Items;

namespace easyJet.Feature.PageContent.Models
{
    public class HealthEntryRequirementTile
    {
        /// <summary>
        /// Initializes a new instance of the <see cref="HealthEntryRequirementTile"/> class.
        /// Ctor is using for serilization.
        /// </summary>
        public HealthEntryRequirementTile()
        {
        }

        public HealthEntryRequirementTile(Item item)
        {
            if (item != null)
            {
                Title = item.Fields[Constants.Fields.HealthEntryRequirementTile.Title]?.Value;
                Description = item.Fields[Constants.Fields.HealthEntryRequirementTile.Description]?.Value;
                Image = item.GetMediaUrl(Constants.Fields.HealthEntryRequirementTile.Image);
                Icon = item.GetMediaUrl(Constants.Fields.HealthEntryRequirementTile.Icon);
                TrackingLabel = item.Fields[Constants.Fields.HealthEntryRequirementTile.TrackingLabel]?.Value;

                if (item.TemplateID.Equals(Constants.TemplateIds.HealthEntryRequirementTile))
                {
                    CTA = new Link(item.Fields[Constants.Fields.HealthEntryRequirementTile.CTA], Sitecore.Context.Site.Name);
                }
                else if (item.TemplateID.Equals(Constants.TemplateIds.FcdoRequirementTile))
                {
                    var linkItem = new LookupField(item.Fields[Constants.Fields.HealthEntryRequirementTile.CTA])?.TargetItem;
                    if (linkItem != null)
                    {
                        CTA = new Link(linkItem.Fields[Constants.Fields.NavigationLink.Link], Sitecore.Context.Site.Name);
                        var linkText = item.Fields[Constants.Fields.FcdoRequirementTile.LinkText].Value;
                        if (!string.IsNullOrWhiteSpace(linkText))
                        {
                            CTA.Text = linkText;
                        }
                    }
                }
            }
        }

        /// <summary>
        /// Gets or Sets title.
        /// </summary>
        public string Title { get; set; }

        /// <summary>
        /// Gets or Sets description.
        /// </summary>
        public string Description { get; set; }

        /// <summary>
        /// Gets or Sets image.
        /// </summary>
        public string Image { get; set; }

        /// <summary>
        /// Gets or Sets icon.
        /// </summary>
        public string Icon { get; set; }

        /// <summary>
        /// Gets or Sets call to action link.
        /// </summary>
        public Link CTA { get; set; }

        /// <summary>
        /// Gets or sets the tracking label.
        /// </summary>
        /// <value>
        /// The tracking label.
        /// </value>
        public string TrackingLabel { get; set; }
    }
}