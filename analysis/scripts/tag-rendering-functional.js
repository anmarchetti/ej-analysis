import neo4j from "neo4j-driver";
import fs from "fs";
import csv from "csv-parser";
import { Command } from "commander";
const program = new Command();

// Set up Neo4j connection
program
  .version("1.0.0", "-v, --version")
  .usage("[OPTIONS]...")
  .option("-u, --user <value>", "Username of neo4j database", "neo4j")
  .option("-p, --password <value>", "Password of neo4j database", "neo4j")
  .option("-r, --uri <value>", "URI of neo4j database", "bolt://localhost:7687")
  .parse(process.argv);

const options = program.opts();

// Set up Neo4j connection
const uri = options.uri;
const user = options.user;
const password = options.password;
const driver = neo4j.driver(uri, neo4j.auth.basic(user, password));

async function updateNodesWithCSV(filePath) {
  const session = driver.session();

  try {
    const dataMap = new Map();

    fs.createReadStream(filePath)
      .pipe(csv())
      .on("data", (data) => {
        const rendering = data.RENDERING + ".tsx";
        const tags = [];
        tags.push(data.TAG);
        data.TAG1.length > 0 && tags.push(data.TAG1);
        // Gestione attributo functionalTags
        const functionalTags = data.FUNCTIONAL_TAGS ? data.FUNCTIONAL_TAGS.split('/').map(tag => tag.trim()) : [];

        // Mapping data in dataMap
        if (!dataMap.has(rendering)) {
          dataMap.set(rendering, {
            tags: tags,
            functionalTags: functionalTags
          });
        } else {
          let storedData = dataMap.get(rendering);
          storedData.tags = [...new Set([...storedData.tags, ...tags])];
          storedData.functionalTags = [...new Set([...storedData.functionalTags, ...functionalTags])];
        }
        
      })
      .on("end", async () => {
        try {
          // Esegue tutte le query functionalTags , n.functionalTags = $functionalTags
          for (let [rendering, {tags, functionalTags}] of dataMap) {
            const query = `
              MERGE (n:Rendering {name: $rendering, component: "frontend"})
              SET n.frontendTags = $functionalTags
            `;
            await session.run(query, { rendering, functionalTags });
            console.log(`Updated rendering '${rendering}' with tags and functional tags.`);
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

updateNodesWithCSV("input_data/RenderingTagFrontend.csv");
