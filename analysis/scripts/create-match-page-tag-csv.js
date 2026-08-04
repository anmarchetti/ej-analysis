import neo4j from "neo4j-driver";
import { createObjectCsvWriter }from "csv-writer";
import dotenv from "dotenv";

// Set up Neo4j connection
dotenv.config();
const uri = process.env.NEO4J_URI;
const user = process.env.NEO4J_USER; // Assicurati di definire questa variabile nel tuo file .env
const password = process.env.NEO4J_PASSWORD;

const driver = neo4j.driver(uri, neo4j.auth.basic(user, password));
const session = driver.session();

// Query Neo4j
const query = `
MATCH p=(pg:Page)-[r:HAS_TEMPLATE]->(t)-[r2:CONTAINS]->(s)-[r3:HAS_RENDERING]->(re)
RETURN DISTINCT pg.name AS pageName, pg.webUrl AS page, t.name AS template, s.name AS slot, s.uid AS uid, re.name AS rendering, re.tags AS tags
`;

async function exportData() {
    try {
        const result = await session.run(query);
        
        const data = result.records.map(record => ({
            page: record.get('page'),
            name: record.get('pageName'),
            template: record.get('template'),
            slot: record.get('slot'),
            uid: record.get('uid'),
            rendering: record.get('rendering'),
            tags: record.get('tags'),
        }));

        // Crea un writer CSV con la specifica del percorso e degli headers
        const csvWriter = createObjectCsvWriter({
            path: 'output_data/pageRendering.csv',
            header: [
                {id: 'page', title: 'PAGE'},
                {id: 'name', title: 'NAME'},
                {id: 'template', title: 'TEMPLATE'},
                {id: 'slot', title: 'SLOT'},
                {id: 'rendering', title: 'RENDERING'},
                {id: 'tags', title: 'TAGS'},
                {id: 'uid', title: 'UID'}
            ]
        });

        // Scrive i dati nel file CSV
        await csvWriter.writeRecords(data);
        console.log('Scrivi i dati CSV completato.');
    } catch (error) {
        console.error('Errore durante l\'esportazione dei dati:', error);
    } finally {
        await session.close();
        await driver.close();
    }
}

exportData();