import neo4j from 'neo4j-driver';
import { Command } from 'commander';
const program = new Command();

program
    .version('1.0.0', '-v, --version')
    .usage('[OPTIONS]...')
    .option('-u, --user <value>', 'Username of neo4j database', 'neo4j')
    .option('-p, --password <value>', 'Password of neo4j database', 'neo4j')
    .option('-r, --uri <value>', 'URI of neo4j database', 'bolt://localhost:7687')
    .parse(process.argv);

const options = program.opts();

// Set up Neo4j connection
const uri = options.uri;
const user = options.user;
const password = options.password;
const driver = neo4j.driver(uri, neo4j.auth.basic(user, password));

const session = driver.session();


const results = await session.run(`
   
    MATCH (r:Rendering)-[:IMPORTS]->(comp:Component)
    MATCH (r)-[:HAS_FUNCTION*]->(f1)-[:CALLS*0..150]->(fx)-[:CALLS*0..150]->(f2:Function {owner: "endpoints.ts"})-[ep:CALLS_API*]->(a:APIInterface)
    MATCH (a)-[:INTERFACE_OF]->(api:API)
    WITH a, r, comp, api.tradePostBookingTags AS tradeTags
    UNWIND tradeTags AS functionalTags
    WITH DISTINCT functionalTags, a, r, comp
    WITH COLLECT(DISTINCT functionalTags) AS uniqueTags, a, r, comp, [a, r, comp] AS nodesList
    FOREACH (node IN nodesList | 
        SET node.tradePostBookingTags = CASE
        WHEN node.tradePostBookingTags IS NULL THEN 
        CASE WHEN uniqueTags IS NULL THEN [] ELSE uniqueTags END
        ELSE REDUCE(s = [], x IN node.tradePostBookingTags + COALESCE(uniqueTags, []) | CASE WHEN x IN s THEN s ELSE s + x END)
    END)
`);


console.log(`Generated tags ${results.records.length}.`)

await driver.close()