using easyJet.Holidays.Api.Domain.Settings;
using easyJet.Holidays.Api.Domain.Utils;
using FluentAssertions;
using System.Globalization;
using System.Text;
using Xunit;

namespace easyJet.Holidays.Api.Domain.Tests.Utils
{
    public class EncryptionUtilsTests
    {
        private readonly DAIntegrationSettings settings;

        public EncryptionUtilsTests()
        {
            settings = new DAIntegrationSettings()
            {
                EncryptionPassword = "p@sswrdo",
                EncryptionSalt = "easyjetpass"
            };
        }

        [Theory]
        [MemberData(nameof(Encrypt_ProducesCorrectValueData))]
        public void Encrypt_ProducesCorrectValue_WhenProvidedPocoEntity(object input, byte[] expected)
        {
            // Act
            var res = EncryptionUtils.Encrypt(input, settings.EncryptionPassword, settings.EncryptionSalt);

            // Assert
            res.Should().BeEquivalentTo(expected);
        }

        public static readonly List<object[]> Encrypt_ProducesCorrectValueData = new List<object[]>
        {
            new object[] { new TestPoco { A = 12, B = "test" }, HexStringToByteArray("b79a9b68952634ebb7545a2970e3b964d56ff8dafcbc9d94fa96aa6a23aa554c") }
        };

        [Theory]
        [MemberData(nameof(Decrypt_ProducesCorrectValueData))]
        public void Decrypt_ProducesCorrectValue_WhenProvidedPocoEntity(byte[] input, object expected)
        {
            // Act
            var res = EncryptionUtils.Decrypt<TestPoco>(input, settings.EncryptionPassword, settings.EncryptionSalt);

            // Assert
            res.Should().BeEquivalentTo(expected);
        }


        [Theory]
        [MemberData(nameof(EncryptValue_ProducesCorrectValueData))]
        public void EncryptValue_ProducesCorrectValue(string input, string expected)
        {
            // Act
            var res = EncryptionUtils.EncryptValue(input, settings.EncryptionPassword, settings.EncryptionSalt);

            // Assert
            res.Should().Be(expected);
        }

        public static readonly List<object[]> EncryptValue_ProducesCorrectValueData = new List<object[]>
        {
            new object[] {"", "ae8fb35f4c575bec9cdc97a7629f5489" },
            new object[] {"test", "e6b3dc2e59e66a0cf67ab10e9dee4a1f" },
        };

        [Theory]
        [MemberData(nameof(DecryptValue_ProducesCorrectValueData))]
        public void DecryptValue_ProducesCorrectValue(string input, string expected)
        {
            // Act
            var res = EncryptionUtils.DecryptValue(input, settings.EncryptionPassword, settings.EncryptionSalt);

            // Assert
            res.Should().Be(expected);
        }

        public static readonly List<object[]> DecryptValue_ProducesCorrectValueData = new List<object[]>
        {
            new object[] { "ae8fb35f4c575bec9cdc97a7629f5489", "" },
            new object[] { "e6b3dc2e59e66a0cf67ab10e9dee4a1f", "test" },
        };

        public static readonly List<object[]> Decrypt_ProducesCorrectValueData = new List<object[]>
        {
            new object[] { HexStringToByteArray("b79a9b68952634ebb7545a2970e3b964d56ff8dafcbc9d94fa96aa6a23aa554c"), new TestPoco { A = 12, B = "test" }, }
        };

        private static byte[] HexStringToByteArray(string value)
        {
            StringBuilder sb = new StringBuilder(value);

            int positionInValue = 0;
            int bufferPos = 0;

            byte[] buffer = new byte[sb.Length / 2];

            while (bufferPos < buffer.Length && positionInValue < sb.Length)
            {
                buffer[bufferPos] = Byte.Parse(sb.ToString(positionInValue, 2), NumberStyles.HexNumber, CultureInfo.InvariantCulture);
                positionInValue += 2;
                bufferPos++;
            }

            return buffer;
        }

        public class TestPoco
        {
            public int A { get; set; }
            public string B { get; set; }
        }
    }
}
