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

  // remove all tags
  if (options.clean) {
    const clean = await session.run(`
      MATCH (p)
      REMOVE p.tags
    `);
  }

  try {
    const dataMap = new Map();

    fs.createReadStream(filePath)
      .pipe(csv())
      .on("data", (data) => {
        const route = data.Route;
        const functionalTags = dataMap.get(route) || [];
        functionalTags.push(data.FunctionalTag);
        dataMap.set(route, functionalTags);
      })
      .on("end", async () => {
        try {
          // Esegue tutte le query
          for (let [route, functionalTags] of dataMap) {
            const query = `
                MERGE (n:APIInterface {name: $route, route:$route, component: "frontend"})
                SET n.functionalTags = $functionalTags
              `;
            await session.run(query, { route, functionalTags });
            console.log(`Updated API '${route}' with ${functionalTags}.`);
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

updateNodesWithCSV("input_data/FunctionalTags.csv");
