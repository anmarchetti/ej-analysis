using AutoFixture;
using easyJet.Holidays.Tests.Domain.Extensions;
using Microsoft.AspNetCore.Http;
using Moq;

namespace easyJet.Holidays.Tests.Domain.Mock
{
    public static class MocksProvider
    {
        public static Mock<IHttpContextAccessor> BuildHttpContext(IFixture fixture, bool noCookie = false,
            bool withHeaders = false)
        {
            var cookies =
                MockRequestCookieCollectionExtension.MockRequestCookieCollectionDictionary("cookie",
                    noCookie ? null : "cookie");

            var requestMock = fixture.Freeze<Mock<HttpRequest>>();
            requestMock
                .Setup(cm => cm.Cookies)
                .Returns(cookies);
            var contextMock = fixture.Freeze<Mock<HttpContext>>();
            contextMock
                .SetupGet(c => c.Request)
                .Returns(requestMock.Object);

            var hca = fixture.Freeze<Mock<IHttpContextAccessor>>();
            hca
                .SetupGet(x => x.HttpContext)
                .Returns(contextMock.Object);

            return hca;
        }

    }
}