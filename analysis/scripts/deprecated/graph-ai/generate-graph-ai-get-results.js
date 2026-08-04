import OpenAI from "openai";
import neo4j from 'neo4j-driver';

const uri = "bolt://localhost:7687";
const user = "neo4j";
const password = "neo4j";
const driver = neo4j.driver(uri, neo4j.auth.basic(user, password));

const fileId = process.argv[2]

const openai = new OpenAI({
  apiKey: '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'
});

async function main() {
  const file = await openai.files.content(fileId);
  const fileContent = await file.text()

  const elements = fileContent.split('\n');
  const session = driver.session();

  let error = 0;
  let ok = 0;

  for (const element of elements) {
    if (element.trim()) { // Check if the line is not empty
      const obj = JSON.parse(element);

      // Retrieve content from the message
      const content = obj.response.body.choices[0].message.content;

      // Use regex to match content between triple backticks
      const matched = content.match(/```cypher(.*?)```/s); // The 's' flag lets . match newline

      if (matched && matched[1]) {
        const strippedContent = stripComments(matched[1]).replaceAll('cypher', '');
        let trimmedQuery = strippedContent.trim();
        trimmedQuery = trimmedQuery.replace(/\n\s*\n/g, '\n');
        trimmedQuery = trimmedQuery.replaceAll('CREATE', 'MERGE');
        const tx = session.beginTransaction();

        try {
          
          let { records, summary } = await tx.run(`
            ${trimmedQuery}
          `);

          await tx.commit();
        } catch (e) {
          console.error(`Failed to run query (ecc)`);
          error++
          await tx.rollback()
        }

      } else {
        console.log("No code block found or content is empty");
      }

    }
  }
  console.log('Errors:' + error + '/' + elements.length)
  console.log('Ok:' + ok + '/' + elements.length)

  session.close();
  driver.close();
}

function stripComments(code) {
  let strippedCode = code;

  // Remove single-line comments (//)
  strippedCode = strippedCode.replace(/\/\/.*$/gm, '');

  // Remove multi-line comments (/* ... */)
  strippedCode = strippedCode.replace(/\/\*[\s\S]*?\*\//g, '');

  return strippedCode;
}

main();