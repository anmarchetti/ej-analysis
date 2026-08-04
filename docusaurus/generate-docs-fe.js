const fs = require('fs');
const path = require('path');
const axios = require('axios');

const srcDir = '../codebase/frontend/app_/src'; // Path to the source code directory
const destDir = 'easyjet-holidays/docs/codebase-structure'; // Path to the destination docs directory
const openaiApiKey = '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'; // Your OpenAI API Key
const allowedExtensions = ['.tsx', '.ts'];
const max_files = 2200;

// Function to create directories if they don't exist
const ensureDirSync = (dirPath) => {
    if (!fs.existsSync(dirPath)) {
        fs.mkdirSync(dirPath, { recursive: true });
    }
}

// Function to get file description from OpenAI GPT
const describeFile = async (filePath) => {
    try {
        const code = fs.readFileSync(filePath, 'utf8');
        const response = await axios.post('https://api.openai.com/v1/chat/completions', {
            model: "gpt-4-turbo",
            messages: [{
                role: "user",
                content: `You are a great front-end and sitecore developer. Create a tecnical documentation of the following code in Markdown:\n\`\`\`javascript\n${code}\n\`\`\`. 
                          Focus on 3 main aspects: imports, structure, logic. Use headings to display these 3 sections of the documentation. Do not put a h1 element as title.`
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

let count = 0;
// Main function to process each file and create corresponding .md file
const processFiles = async (dir, relativePath = '') => {
    const files = fs.readdirSync(dir);
    for (const file of files) {
        const fullPath = path.join(dir, file);
        const relativeFullPath = path.join(relativePath, file);
        const stat = fs.statSync(fullPath);
        if (stat.isDirectory()) {
            ensureDirSync(path.join(destDir, relativeFullPath));
            let category_obj = {
                "label": file,
                "link": {
                    "type": "generated-index"
                }
            }

            await fs.writeFileSync(path.join(destDir, relativeFullPath) + '/_category_.json', JSON.stringify(category_obj));
            await processFiles(fullPath, relativeFullPath);
        } else if (stat.isFile() && allowedExtensions.includes(path.extname(file)) && file.indexOf('test') == -1) {
            const mdFilePath = path.join(destDir, `${relativeFullPath}.md`);

            if (!fs.existsSync(mdFilePath)) {
                const description = await describeFile(fullPath);
                await fs.writeFileSync(mdFilePath, description);
                console.log(`Created Markdown file: ${mdFilePath}`);
            } else {
                console.log(`Markdown file already exists, skipping: ${mdFilePath}`);
            }

            console.log(++count)
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
