const fs = require('fs');
const path = require('path');
const axios = require('axios');

const srcDir = '../codebase/backend'; // Path to the source code directory
const destDir = 'easyjet-holidays/docs/codebase-structure/backend'; // Path to the destination docs directory
const openaiApiKey = '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'; // Your OpenAI API Key
const allowedExtensions = ['.cs'];
const exclusions = ['Test']
const max_files = 2200;

// Function to create directories if they don't exist
const ensureDirSync = (dirPath) => {
    if (!fs.existsSync(dirPath)) {
        fs.mkdirSync(dirPath, { recursive: true });
    }
}

const folderMap = {
    "easyJet.Holidays.Api": "API",
    "easyJet.Holidays.Api.Domain": "Domain",
    "easyJet.Holidays.External.AWS": "External Services",
    "easyJet.Holidays.External.Atcom": "External Services",
    "easyJet.Holidays.External.B2B": "External Services",
    "easyJet.Holidays.External.Cms": "External Services",
    "easyJet.Holidays.External.DA": "External Services",
    "easyJet.Holidays.External.Dflo": "External Services",
    "easyJet.Holidays.External.Domain": "External Services",
    "easyJet.Holidays.External.EI": "External Services",
    "easyJet.Holidays.External.Eskel": "External Services",
    "easyJet.Holidays.External.Feefo": "External Services",
    "easyJet.Holidays.External.Google": "External Services",
    "easyJet.Holidays.External.Musement": "External Services",
    "easyJet.Holidays.External.Salesforce": "External Services",
    "easyJet.Holidays.External.SmartSeer": "External Services",
    "easyJet.Holidays.External.Tracker": "External Services",
    "easyJet.Holidays.External.TripAdvisor": "External Services",
    "easyJet.Holidays.External.Verint": "External Services",
    "easyJet.Holidays.External.Voucherify": "External Services",
    "easyJet.Holidays.CancelBookingApp": "Function",
    "easyJet.Holidays.ExportExpiredVouchers": "Function",
    "easyJet.Holidays.External.AWS.BookingExtractor": "Function",
    "easyJet.Holidays.External.AWS.BookingSalesforce": "Function",
    "easyJet.Holidays.External.AWS.BookingTracker": "Function",
    "easyJet.Holidays.External.AWS.BookingsMarginsSync": "Function",
    "easyJet.Holidays.External.AWS.CopyInfPaxFile": "Function",
    "easyJet.Holidays.External.AWS.DistressedTaxFile": "Function",
    "easyJet.Holidays.External.AWS.DmcManager": "Function",
    "easyJet.Holidays.External.AWS.Domain": "Function",
    "easyJet.Holidays.External.AWS.ErrataInfoSync": "Function",
    "easyJet.Holidays.External.AWS.ExportCSAT": "Function",
    "easyJet.Holidays.External.AWS.ExportCSATUnsubscribes": "Function",
    "easyJet.Holidays.External.AWS.ExportFromInfare": "Function",
    "easyJet.Holidays.External.AWS.FPSExport": "Function",
    "easyJet.Holidays.External.AWS.FPSSync": "Function",
    "easyJet.Holidays.External.AWS.FeefoDataGenerator": "Function",
    "easyJet.Holidays.External.AWS.FreeNightsDataSync": "Function",
    "easyJet.Holidays.External.AWS.GetEmailsToCheckCSAT": "Function",
    "easyJet.Holidays.External.AWS.GetEmailsToCheckFeefo": "Function",
    "easyJet.Holidays.External.AWS.HistoryIdExtrator": "Function",
    "easyJet.Holidays.External.AWS.ImportCSAT": "Function",
    "easyJet.Holidays.External.AWS.ImportWeatherData": "Function",
    "easyJet.Holidays.External.AWS.LeaseFlightsFilter": "Function",
    "easyJet.Holidays.External.AWS.LeaseFlightsParser": "Function",
    "easyJet.Holidays.External.AWS.LiveChatTracker": "Function",
    "easyJet.Holidays.External.AWS.LivePriceSync": "Function",
    "easyJet.Holidays.External.AWS.MessageTracker": "Function",
    "easyJet.Holidays.External.AWS.PaymentToSNS": "Function",
    "easyJet.Holidays.External.AWS.RequestedPriceSync": "Function",
    "easyJet.Holidays.External.AWS.RouteFileParser": "Function",
    "easyJet.Holidays.External.AWS.SendEmailsToFeefo": "Function",
    "easyJet.Holidays.External.AWS.UploadToAirCube": "Function",
    "easyJet.Holidays.External.ExpiringVouchersApi": "Function",
    "easyJet.Holidays.External.ExportCallCentreVouchers": "Function"
}


// Function to get file description from OpenAI GPT
const describeFile = async (filePath) => {
    try {
        const code = fs.readFileSync(filePath, 'utf8');
        const response = await axios.post('https://api.openai.com/v1/chat/completions', {
            model: "gpt-4o",
            messages: [{
                role: "user",
                content: `You are a great backend C# developer. Create a tecnical documentation of the following code in Markdown:
                \`\`\`c#
                ${code}
                \`\`\`
                Focus on 4 main aspects: 1. imports, 2. dependencies, 3. brief class description with high-level logic description, 4. methods with method name as title with only the number of params in pharentesis and subsections signature, input details, output details and high-level logic description. Use headings to display these 4 sections of the documentation. Do not put a h1 element as title.`
            }],
            temperature: 0.5
        }, {
            headers: {
                'Authorization': `Bearer ${openaiApiKey}`,
                'Content-Type': 'application/json'
            }
        });
        console.log()
        return response.data.choices[0].message.content.trim();
    } catch (error) {
        console.error('Failed to describe file:', filePath, error);
        return 'Description not available.';
    }
};

function removeMarkdownDirective(markdown){
    return markdown.replaceAll(/\`\`\`markdown/g, '');
}

function escapeCharsElements(markdown) {
    // Escape within **strong** elements
    markdown = markdown.replace(/\((.*?)\)\:/g, (match, content) => {
        const escapedContent = content.replace(/</g, '\\\<').replace(/>/g, '\\\>');
        return `(${escapedContent}):`;
    });
    markdown = markdown.replace(/\# (.*)/g, (match, content) => {
        const escapedContent = content.replace(/</g, '\\\<').replace(/>/g, '\\\>');
        return `# ${escapedContent}`;
    });
    // Escape within (parentheses) 
    return markdown.replace(/\*\*(.*?)\*\*/g, (match, content) => {
        const escapedContent = content.replace(/</g, '\\\<').replace(/>/g, '\\\>');
        return `**${escapedContent}**`;
    });
}

let count = 0;
// Main function to process each file and create corresponding .md file
const processFiles = async (dir, relativePath = '') => {
    const files = fs.readdirSync(dir);
    const allowedFolders = Object.keys(folderMap);

    for (const file of files) {
        const fullPath = path.join(dir, file);
        const relativeFullPath = path.join(relativePath, file);

        const folder = allowedFolders.find(folder => relativeFullPath.startsWith(folder))

        if (folder && !exclusions.some(rule => relativeFullPath.includes(rule))) {
            const stat = fs.statSync(fullPath);
            if (stat.isDirectory()) {
                console.log(folderMap[folder])
                console.log(path.join(destDir, folderMap[folder], relativeFullPath))
                ensureDirSync(path.join(destDir, folderMap[folder], relativeFullPath));

                let category_obj = {
                    "label": file,
                    "link": {
                        "type": "generated-index"
                    }
                }

                await fs.writeFileSync(path.join(destDir, folderMap[folder], relativeFullPath) + '/_category_.json', JSON.stringify(category_obj));
                await processFiles(fullPath, relativeFullPath);
            } else if (stat.isFile() && allowedExtensions.includes(path.extname(file))) {
                const mdFilePath = path.join(destDir, folderMap[folder], `${relativeFullPath}.md`);

                if (!fs.existsSync(mdFilePath)) {
                    const description = removeMarkdownDirective(escapeCharsElements(await describeFile(fullPath)));
                    await fs.writeFileSync(mdFilePath, description);
                    console.log(`Created Markdown file: ${mdFilePath}`);
                } else {
                    // const doc = fs.readFileSync(mdFilePath, 'utf8');
                    // const outputMarkdown = removeMarkdownDirective(doc);
                    // await fs.writeFileSync(mdFilePath, outputMarkdown);
                    console.log(`Markdown file already exists, skipping: ${mdFilePath}`);
                }

                console.log(`${++count}/1609`)
            }
        }
    }
};

// Ensure the destination directory exists
ensureDirSync(destDir);

// Start processing the source directory
processFiles(srcDir).then(() => {
    console.log('Documentation generation completed.');
}).catch(error => {
    console.error('An error occurred:', error);
});
