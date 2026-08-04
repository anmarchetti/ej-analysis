using System.IO;
using AutoFixture;

namespace easyJet.Foundation.Testing.Customization
{
    public class OmitExtensionStreamPropertyCustomization : ICustomization
    {
        public void Customize(IFixture fixture)
        {
            fixture.Register<Stream>(() => null);
        }
    }
}
