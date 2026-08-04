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
console.log(tagAttr);

async function updateRenderingNode(tagAttr) {
  const session = driver.session();
  // remove all tags
  if (options.clean) {
    const clean = await session.run(`
        MATCH (p)
        REMOVE p.${tagAttr}
    `);
  }
  try {
    // Query per modificare dinamicamente un attributo basato su `tagAttr`
    const query = `
      MATCH (n:Rendering)
      SET n.${tagAttr} = [n.name]
      RETURN n
    `;

    const result = await session.run(query, { tagTagAttr: tagAttr });
    console.log("Node updated:", result.records.length);
  } catch (error) {
    console.error("Error updating the node:", error);
  } finally {
    await session.close();
  }
}

// Usa la funzione
updateRenderingNode(tagAttr).then(() => {
  driver.close();
});
