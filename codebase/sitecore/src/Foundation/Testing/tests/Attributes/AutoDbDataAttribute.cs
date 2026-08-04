using System;
using AutoFixture;
using AutoFixture.AutoNSubstitute;
using AutoFixture.Xunit2;
using easyJet.Foundation.Testing.Customization;
using Sitecore.FakeDb.AutoFixture;

namespace easyjet.Foundation.Testing.Attributes
{
    [Obsolete("Do not use Sitecore.FakeDb. Use abstraction instead.")]
    public class AutoDbDataAttribute : AutoDataAttribute
    {
        public AutoDbDataAttribute()
            : base(() =>
            {
                var fixture = new Fixture()
                .Customize(new AutoDbCustomization())
                .Customize(new AutoContentCustomization())
                .Customize(new OmitExtensionStreamPropertyCustomization())
                .Customize(new AutoNSubstituteCustomization());

                return fixture;
            })
        {
        }
    }
}