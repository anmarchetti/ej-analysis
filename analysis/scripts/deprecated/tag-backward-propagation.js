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
  .parse(process.argv);

const options = program.opts();

// Set up Neo4j connection
const uri = options.uri;
const user = options.user;
const password = options.password;
const driver = neo4j.driver(uri, neo4j.auth.basic(user, password));

const session = driver.session();

// remove all tags
if (options.clean) {
  const clean = await session.run(`
        MATCH (p)
        REMOVE p.tags
    `);
}

async function propagateTag() {
  //per ogni rendering devo fare questa query
  const result = await session.run(
    `MATCH (r:Rendering)
        WITH r.frontendTags AS newTag
        WHERE newTag IS NOT NULL 
        MATCH (r)-[:HAS_FUNCTION]->(f:Function)
        MATCH (f)-[:CALLS*0..100]->(depFunc)
        MATCH (depFunc)-[:CALLS_API]->(api:APIInterface)
        SET f.frontendTags = CASE
                WHEN f.frontendTags IS NULL THEN [newTag]
                ELSE REDUCE(s = [], x IN f.frontendTags + newTag | CASE WHEN x IN s THEN s ELSE s + x END)
            END,
            depFunc.frontendTags = CASE
                WHEN depFunc.frontendTags IS NULL THEN [newTag]
                ELSE REDUCE(s = [], x IN depFunc.frontendTags + newTag | CASE WHEN x IN s THEN s ELSE s + x END)
            END,
            api.frontendTags = CASE
                WHEN api.frontendTags IS NULL THEN [newTag]
                ELSE REDUCE(s = [], x IN api.frontendTags + newTag | CASE WHEN x IN s THEN s ELSE s + x END)
            END
        RETURN r,f, depFunc, api`
  );
  console.log(`Generated tags: ${result.records.length}`);
}

propagateTag()
  .then(() => {
    console.log(`Data created successfully`);
  })
  .catch(console.error)
  .finally(() => {
    driver.close();
  });
