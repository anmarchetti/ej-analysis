import neo4j from "neo4j-driver";
import { Command } from "commander";
const program = new Command();

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

const session = driver.session();

const results = await session.run(`
        MATCH (w:Widget), (r:Rendering)
        WHERE w.name = r.name
        MERGE (w)-[relations:HAS_RENDERING]->(r)
        return relations
`);

console.log(`Generated (not unique) rendering-widget ${results.records.length} relations.`)

const tResult = await session.run(`
  MATCH (t:Template)
  MATCH (l:Component {name:"Layout.tsx", component:"frontend"})
  MERGE (t)-[relations:IS_IMPLEMENTED]->(l)
  return relations
`);

console.log(`Generated (not unique) template-layout ${tResult.records.length} relations.`)

const bigResult = await session.run(`
  MATCH (api:API), (apiInterface:APIInterface)
  WHERE api.route = apiInterface.route
  MERGE (apiInterface)-[:INTERFACE_OF]->(api)
`);

console.log(`Generated (not unique) frontend vs backend ${bigResult.records.length} relations.`)

await driver.close();
