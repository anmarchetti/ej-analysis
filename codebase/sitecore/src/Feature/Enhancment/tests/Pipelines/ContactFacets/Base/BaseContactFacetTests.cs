using System.Collections.Generic;
using System.Reflection;
using Sitecore.XConnect;

namespace tests.Pipelines.ContactFacets.Base
{
    public abstract class BaseContactFacetTests
    {
        protected abstract string FacetKey { get; }

        public virtual Contact GetContactWithFacet()
        {
            var contact = new Contact();
            var property = contact.GetType().GetProperty("FacetMap", BindingFlags.Public | BindingFlags.NonPublic | BindingFlags.Instance);
            if (property != null)
            {
                property.SetValue(contact, GetFacets());
            }

            return contact;
        }

        protected abstract Dictionary<string, Facet> GetFacets();
    }
}
