import neo4j from "neo4j-driver";
import fs from "fs";
import csv from "csv-parser";
import { Command } from "commander";
const program = new Command();

// Set up Neo4j connection
program
  .version("1.0.0", "-v, --version")
  .usage("[OPTIONS]...")
  .option("-c, --clean", "Clean tags before running")
  .option("-u, --user <value>", "Username of neo4j database", "neo4j")
  .option("-p, --password <value>", "Password of neo4j database", "neo4j")
  .option("-z, --tagAttr <value>", "tag name to apply")
  .option("-r, --uri <value>", "URI of neo4j database", "bolt://localhost:7687")
  .parse(process.argv);

const options = program.opts();

// Set up Neo4j connection
const uri = options.uri;
const user = options.user;
const password = options.password;
const driver = neo4j.driver(uri, neo4j.auth.basic(user, password));
const tagAttr = options.tagAttr;

async function updateNodesWithCSV(filePath) {
  const session = driver.session();

  // remove all tags
  if (options.clean) {
    const clean = await session.run(`
      MATCH (p)
      REMOVE p.${tagAttr}
    `);
  }

  try {
    const dataMap = new Map();

    fs.createReadStream(filePath)
      .pipe(csv())
      .on("data", (data) => {
        const rendering = data.RENDERING + ".tsx";
        const tags = dataMap.get(rendering) || []; //these are tag from the excel
        tags.push(data.TAG);
        data.TAG1.length > 0 && tags.push(data.TAG1);
        dataMap.set(rendering, tags);
      })
      .on("end", async () => {
        try {
          // Esegue tutte le query
          for (let [rendering, tags] of dataMap) {
            const query = `
                MERGE (n:Rendering {name: $rendering, component: "frontend"})
                SET n.${tagAttr} = $tags
              `;
            await session.run(query, { rendering, tags });
            console.log(`Updated rendering '${rendering}' with tags.`);
          }
        } catch (error) {
          console.error("Error during query execution:", error);
        } finally {
          // Chiude sessione e driver solo dopo aver completato tutte le query
          session.close();
          driver.close();
        }
      });
  } catch (error) {
    console.error("Error during file processing:", error);
    await session.close();
    await driver.close();
  }
}

updateNodesWithCSV("input_data/RenderingTag.csv");
