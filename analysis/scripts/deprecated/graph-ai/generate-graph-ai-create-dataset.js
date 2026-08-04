import fs from "fs";
import path from 'path';


// const files = [
//     '../app_/src/frontend/components/common/BookingErrorPopup.tsx',
//     '../app_/src/frontend/services/booking.service.ts',
//     '../app_/src/frontend/store/tradePortal/offers/TradePortalOffersStore.ts',
//     '../app_/src/frontend/components/renderings/ViewBooking/ViewBooking.tsx',
// ]

const exclusions = ['.test.', 'componentFactory', 'icons', '__mocks__']

function isExcluded(fileName) {
    return exclusions.some(excludedStr => fileName.includes(excludedStr));;
}

function getAllTsFiles(dir, exclusions = [], fileList = []) {
    const files = fs.readdirSync(dir, { withFileTypes: true });
    files.forEach(file => {
        const filePath = path.join(dir, file.name);
        if (file.isDirectory()) {
            fileList = getAllTsFiles(filePath, exclusions, fileList); // Recursively call for directories
        } else if (file.isFile() && (file.name.endsWith('.ts') || file.name.endsWith('.tsx')) && !isExcluded(filePath)) {
            fileList.push(filePath);
        }
    });
    return fileList;
}

const files = getAllTsFiles('../app_/src');

console.log('Codebase size (files): ' + files.length)

 // Making sure the directory exists
 fs.mkdirSync('./data', { recursive: true });

 // Empty the file by writing an empty string to it
 fs.writeFileSync('./data/batchinput.jsonl', '');

for (let i = 0; i < files.length; i++) {
    
    const file = files[i];
    
    try {
        // Synchronous reading of the file content into a variable
        const fileContent = fs.readFileSync(file, 'utf8');

        const prompt = `
                \`\`\`${fileContent}\`\`\`
                I need to create a graph of dependencies in neo4j between the components of a next project.
                This file name is: '${path.basename(file)}'
                Given the current provided file I want to create:
                1.  The current file node, it can be of 4 types 
                --- Service if the name of the file containes '.service.', it will create a Service node
                --- Rendeing if the file imports the 'ISitecoreComponent', it will create a Rendering node
                --- Store if it is a store component (you can detect it), it will create a Store node
                --- Component if it is none of the previous types, it will create a Component node
                2. All the exported functions by this file, it will create Function nodes
                3. All the called functions by this file, it will create Function nodes with an attribute called "owner" that will store the owner of the called function
                4. The relation between the node representing this file and the exported functions, the relation must be called "EXPORTS"  (ex. Rendering EXPORTS nameOfTheFunction)
                5. The relation between the node representing this file and all the called functions, the relation must be called "CALLS"  (ex. Rendering USES nameOfTheFunction)

                I need all the entities above, do not provide examples.
                Please provide only the Cypher queries to create above entities in a unique code snippet.
                `

        const json = {
            "custom_id": "request-" + i,
            "method": "POST",
            "url": "/v1/chat/completions",
            "body": {
                "model": "gpt-4-turbo",
                "messages": [
                    { "role": "system", "content": "You are a helpful assistant." },
                    { "role": "user", "content": prompt }
                ],
            }
        }

        // Convert JSON object to string
        const jsonString = JSON.stringify(json) + '\n'; // '\n' adds a newline after each entry

        // Append JSON string to the file
        fs.appendFileSync('./data/batchinput.jsonl', jsonString);

        //console.log('JSON appended to file successfully.');
    } catch (error) {
        console.error('Error reading the file:', error);
    }
}

