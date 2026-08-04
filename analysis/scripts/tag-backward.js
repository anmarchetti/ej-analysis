import neo4j from "neo4j-driver";
import { Command } from "commander";
const program = new Command();

program
  .version("1.0.0", "-v, --version")
  .usage("[OPTIONS]...")
  .option("-c, --clean", "Clean tags before running")
  .option("-u, --user <value>", "Username of neo4j database", "neo4j")
  .option("-p, --password <value>", "Password of neo4j database", "neo4j")
  .option("-r, --uri <value>", "URI of neo4j database", "bolt://localhost:7687")
  .option("-z, --tagAttr <value>", "tag type to propagate backward")
  .parse(process.argv);

const options = program.opts();

// Set up Neo4j connection
const uri = options.uri;
const user = options.user;
const password = options.password;
const driver = neo4j.driver(uri, neo4j.auth.basic(user, password));
const tagAttr = options.tagAttr;

const session = driver.session();

// remove all tags
if (options.clean) {
  const clean = await session.run(`
        MATCH (p)
        REMOVE p.frontendTags
    `);
}

// clean redundant nodes
const cleanReduntantNodes = await session.run(`
  MATCH (n)-[r]->(n)
  DELETE r
  RETURN r
`);

console.log(`Removed reduntant relations: ${cleanReduntantNodes.records.length}`);

const results = await session.run(`
    MATCH (r:Rendering)-[:HAS_FUNCTION*]->(f1)-[:CALLS*0..150]->(fx)-[:CALLS*0..150]->(f2:Function {owner: "endpoints.ts"})-[ep:CALLS_API*]->(api:APIInterface)-[:INTERFACE_OF]->(a:API)
    WITH r.${tagAttr} AS renderingTags, api, f1, f2,fx
    UNWIND renderingTags AS tag
    WITH DISTINCT tag, api, f1, f2, fx
    WITH COLLECT(DISTINCT tag) AS uniqueTags, api, f1, f2, fx, [api, f1, f2, fx] AS nodesList
    FOREACH (node IN nodesList | 
        SET node.${tagAttr} = CASE
        WHEN node.${tagAttr} IS NULL THEN 
        CASE WHEN uniqueTags IS NULL THEN [] ELSE uniqueTags END
        ELSE REDUCE(s = [], x IN node.${tagAttr} + COALESCE(uniqueTags, []) | CASE WHEN x IN s THEN s ELSE s + x END)
  END
    )
    RETURN uniqueTags, api.route, f1.name, f2.name, fx.name
`);

const tResult = await session.run(`
  MATCH (r:Rendering)-[:IMPORTS]->(comp:Component)
  WITH r.${tagAttr} AS renderingTags, comp 
  UNWIND renderingTags AS tag
    WITH DISTINCT tag, comp
    WITH COLLECT(DISTINCT tag) AS uniqueTags, comp
    SET comp.${tagAttr} = CASE
    WHEN comp.${tagAttr} IS NULL THEN 
    CASE WHEN uniqueTags IS NULL THEN [] ELSE uniqueTags END
    ELSE REDUCE(s = [], x IN comp.${tagAttr} + COALESCE(uniqueTags, []) | CASE WHEN x IN s THEN s ELSE s + x END)
END
  RETURN comp
`);

console.log(`Generated tags: ${results.records.length}`);
console.log(`Generated tags: ${tResult.records.length}`);

await driver.close();
