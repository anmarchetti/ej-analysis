using easyJet.Holidays.Api.Domain.Extensions;
using easyJet.Holidays.Api.Domain.Interfaces.Validators;
using easyJet.Holidays.Api.Domain.Validators;
using FluentAssertions;
using Xunit;

namespace easyJet.Holidays.Api.Domain.Tests.Extensions
{
    public class StringExtensionsTests
    {
        public static readonly List<object[]> TextUtilsRemovePhoneNumbersTestData = new List<object[]> {
            new object[] { null, null},
            new object[] { "", ""},
            new object[] { "Tests test 07911 123456 Tests test", "Tests test ************ Tests test"},
            new object[] { "Tests +447911123456 test 07911 123456 Tests test", "Tests ************* test ************ Tests test"},
            new object[] { "Tests +447911123456 test 07911 123456 Tests test 447911123456 hello", "Tests ************* test ************ Tests test ************ hello"},
            new object[] { "Tests+447911123456 test07911 123456 Tests test447911123456 hello", "Tests************* test************ Tests test************ hello"},
            new object[] { "Tests:+447911123456 test:07911 123456 Tests test: 447911123456 hello", "Tests:************* test:************ Tests test: ************ hello"},
            new object[] { "Tests test +7911 123456 test (541) 754-3010 test +1-541-754-3010 test 1-541-754-3010 test 001-541-754-3010 test 191 541 754 3010", "Tests test ************ test ************** test *************** test ************** test **************** test ****************"},
            new object[] { "Tests test +(123) - 456-78-90 test:800-555-5555 test(123) 456-7890 test (01512) 123 1234 test (12) 123 1234 test 1-(123)-123-1234 ", "Tests test ****************** test:************ test************** test **************** test ************* test ****************"},
            new object[] { "Tests test 0732105432 phone 1300333444  (phone) (+44)(0)20-12341234 mobile +44 (0) 1234-1234 test 023-5256677 another(910)456-7890 US 1.222.333.1234", "Tests test ********** phone **********  (phone) ******************* mobile ***************** test *********** another************* US **************"},
            new object[] { "Italian +39 0801231234 phone +390121231234  (phone) 0341231234 mobile +39 056-1231234 test (080)-123-1234 another+390123-123-123 Italy +39(0123)-123-123", "Italian ************** phone *************  (phone) ********** mobile *************** test ************** another*************** Italy *****************"},
            new object[] { "UK 01603 123123 phone 0207 1234567  (phone)  (0208) 123 1234 mobile +447974405524 test +447932205578 another02071111111 UK 01000100000 (07222) 555555 test +44 7222 555 555 one more 07222 555555", "UK ************ phone ************  (phone)  *************** mobile ************* test ************* another*********** UK **********************5555 test **************** one more ************"},
        };

        public static readonly List<object[]> TextUtilsRemoveEmailsTestData = new List<object[]> {
            new object[] { null, null},
            new object[] { "", ""},
            new object[] { "Email tests joe@aol.com email:ssmith@aspalliance.com and a@b.cc", "Email tests *********** email:********************** and ******"},
            new object[] { "Email joe@wrox.co.uk tests  joe@domain.info email foo12@foo.edu andbob_smith@foo.com", "Email ************** tests  *************** email ************* ********************"},
            new object[] { "Email tests blah@127.0.0.1 emailforeignchars@myforeigncharsdomain.nu and username@someserver.domain.com test", "Email tests ************** ***************************************** and ****************************** test"},
            new object[] { "Email tests u-s_e.r1@s-ub2.domain-name.museum:8080 email:user_name@123.123.123.12 and g_s+gav@com.com test  foo99@foo.co.uk", "Email tests *********************************:8080 email:************************ and *************** test  ***************"},
        };

        public static readonly List<object[]> TextUtilsRemoveCardNumbersTestData = new List<object[]> {
            new object[] { null, null},
            new object[] { "", ""},
            new object[] { "Card numbers tests 000000 000000000000 card:000000-000000000000 and 000000000000000000", "Card numbers tests ******************* card:******************* and ******************"},
            new object[] { "Card number 5111 1111 1111 11118 card 1234123412341324 and error API-ERR-300020", "Card number ******************** card **************** and error API-ERR-300020"},
            new object[] { "Card numbers tests 4125632152365  card 4125632569856321 and 418563256985214 test 5431-1111-1111-1111", "Card numbers tests *************  card **************** and *************** test *******************"},
            new object[] { "Discover Card numbers tests 6011-0000-0000-0000 card number 6011000000000000 and 6011 0000 0000 0000 test 371449635398431", "Discover Card numbers tests ******************* card number **************** and ******************* test ***************" },
            new object[] { "JCB Card 3566003566003566 MasterCard 5500005555555559 UnionPay 6240008631401148 Visa 4110144110144115", "JCB Card **************** MasterCard **************** UnionPay **************** Visa ****************" },
            new object[] { "Credit Card 1111-2323-2312-3434 card 1234343425262837 test 1111 2323 2312 3434", "Credit Card ******************* card **************** test *******************" },
            new object[] { "American Express 378282246310005 American Express 371449635398431 American Express Corporate 378734493671000 Australian BankCard 5610591081018250 Diners Club 0569309025904 Discover 6011111111111117", "American Express *************** American Express *************** American Express Corporate *************** Australian BankCard **************** Diners Club ************* Discover ****************" },
            new object[] { "Discover 6011000990139424 JCB 3530111333300000 JCB 3566002020360505 MasterCard: 5555555555554444 Visa 4111111111111111 Visa 012888888881881", "Discover **************** JCB **************** JCB **************** MasterCard: **************** Visa **************** Visa ***************" },
            new object[] { "Mastercard 2223 0000 4841 0010 Visa 4646 4646 4646 4644 Visa 4131 8400 0000 0003 Visa Electron 4001 0200 0000 0009 UATP 1354 1001 4004 955", "Mastercard ******************* Visa ******************* Visa ******************* Visa Electron ******************* UATP ******************" }
        };

        public static readonly List<object[]> TextUtilsRemoveDatesTestData = new List<object[]> {
            new object[] { null, null},
            new object[] { "", ""},
            new object[] { "Date 01/01/2020 Date:01-01-2020 and 01/01/2020", "Date ********** Date:********** and **********"},
        };
        
        public static readonly List<object[]> TextUtilsRemovePostfixTestData = new List<object[]> {
            new object[] { "TEST-POSTFIX", "-POSTFIX", "TEST"},
            new object[] { "TEST-POSTFIX", null, "TEST-POSTFIX"},
            new object[] { "", "-POSTFIX", ""},
        };

        [Theory]
        [MemberData(nameof(TextUtilsRemovePhoneNumbersTestData))]
        public void RemovePhoneNumbers_TestData_ExpectedResults(string text, string expected)
        {
            // Arrange
            var phoneNumberReplacer = new PhoneNumberReplacer();

            // Act
            var actual = text.Validate(new List<IReplace> { phoneNumberReplacer });

            // Assert
            actual.Should().BeEquivalentTo(expected);
        }

        [Theory]
        [MemberData(nameof(TextUtilsRemoveEmailsTestData))]
        public void RemoveEmails_TestData_ExpectedResults(string text, string expected)
        {
            // Arrange
            var emailReplacer = new EmailReplacer();

            // Act
            var actual = text.Validate(new List<IReplace> { emailReplacer });

            // Assert
            actual.Should().BeEquivalentTo(expected);
        }

        [Theory]
        [MemberData(nameof(TextUtilsRemoveCardNumbersTestData))]
        public void RemoveCardNumbers_TestData_ExpectedResults(string text, string expected)
        {
            // Arrange
            var cardNumberReplacer = new CardNumberReplacer();

            // Act
            var actual = text.Validate(new List<IReplace> { cardNumberReplacer });

            // Assert
            actual.Should().BeEquivalentTo(expected);
        }

        [Theory]
        [MemberData(nameof(TextUtilsRemoveDatesTestData))]
        public void RemoveDates_TestData_ExpectedResults(string text, string expected)
        {
            // Arrange
            var dateReplacer = new DateReplacer();

            // Act
            var actual = text.Validate(new List<IReplace> { dateReplacer });

            // Assert
            actual.Should().BeEquivalentTo(expected);
        }
        
        [Theory]
        [MemberData(nameof(TextUtilsRemovePostfixTestData))]
        public void RemovePostfix_TestData_ExpectedResults(string text, string postfix, string expected)
        {
            // Act
            var actual = text.RemovePostfix(postfix);

            // Assert
            actual.Should().BeEquivalentTo(expected);
        }
    }
}
