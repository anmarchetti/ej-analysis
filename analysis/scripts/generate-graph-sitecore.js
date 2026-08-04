import neo4j from 'neo4j-driver';
import ts from 'typescript';
const { createSourceFile, ScriptTarget, SyntaxKind } = ts;
import { Command, Option } from 'commander';
const program = new Command();
import pkg from 'csvtojson';
const { csv } = pkg;
import cliProgress from 'cli-progress';

const pageComponentExport = "./input_data/PageComponentsExport.csv";
const pageComponentExportLayoutComponents = "./input_data/PageComponentsExportLayoutComponents.csv";

program
    .version('1.0.0', '-v, --version')
    .usage('[OPTIONS]...')
    .option('-c, --clean', 'Clean database before running')
    .option('-t, --trace <value>', 'Page to trace information about (ex. "/extras"), "all" traces all rows')
    .option('-u, --user <value>', 'Username of neo4j database', 'neo4j')
    .option('-p, --password <value>', 'Password of neo4j database', 'neo4j')
    .option('-r, --uri <value>', 'URI of neo4j database', 'bolt://localhost:7687')
    .option('-w, --write', 'Write to neo4j', false)
    .parse(process.argv);

const options = program.opts();

// Set up Neo4j connection
const uri = options.uri;
const user = options.user;
const password = options.password;
const driver = neo4j.driver(uri, neo4j.auth.basic(user, password));

const session = driver.session();

async function createGraphFromSitecore(filePath) {

    let progressBar = new cliProgress.SingleBar({}, cliProgress.Presets.shades_classic);

    const extraction = await csv().fromFile(filePath);
    const onlyPublished = extraction.filter(row => ['TRUE', 'True'].includes(row.IsPublishedLive))
    const regex = /\{([^}]+)\}/;
    const slots = {};

    progressBar.start(onlyPublished.length, 0);

    for (const row of onlyPublished) {

        progressBar.increment();

        const pageIdentifier = row.PagePath + ' - ' + row.Language;

        if (options.write) {
            await session.run(`
                MERGE (p:Page {name: $pageName, webUrl: $pageUrl, lang: $lang, component: "frontend"})
                MERGE (t:Template {name: $templateName, component: "frontend"})
                MERGE (p)-[:HAS_TEMPLATE]->(t)
            `, {
                pageName: pageIdentifier,
                lang: row.Language,
                pageUrl: row.PageUrl,
                templateName: row.ItemName
            });
        }

        if (row.PageUrl == options.trace || "all" == options.trace) {
            console.log(`Creating relation between Page "${pageIdentifier}" (url: "${row.PageUrl}") and Template "${row.ItemName}"`);
        }

        const components = row.Components.split('|');

        // gathering all widget uid to find parent child relations afterwards
        for (const component of components) {
            const elements = component.split('_');
            const widgetUid = elements[1].replaceAll('{', '').replaceAll('}', '').toUpperCase();
            const widget = elements[0].replaceAll(' ', '').concat('.tsx');
            slots[widgetUid] = widget;
        }

        // iterate again but know crate all relations
        for (const component of components) {
            const elements = component.split('_');
            const widgetUid = elements[1].replaceAll('{', '').replaceAll('}', '').toUpperCase();
            const widget = elements[0].replaceAll(' ', '').concat('.tsx');

            let containingSlotName = elements[2] != "" ? elements[2] : 'unknown';
            let containingSlotUid = 'unknown';

            if (elements[2].includes("{")) { // it means there is a containing element
                containingSlotUid = elements[2].match(regex)[1].toUpperCase()
                containingSlotName = elements[2].split("-{")[0];
            }

            if (containingSlotUid == 'unknown') {
                // create template -> slot -> widget relation
                if (options.write) {
                    await session.run(`
                        MERGE (t:Template {name: $template, component: "frontend"})
                        MERGE (s:Slot {name: $slot, uid: $slotUid, webUrl: $pageUrl, lang: $lang, component: "frontend"})
                        MERGE (r:Widget {name: $widget, uid: $slotUid, webUrl: $pageUrl, lang: $lang, component: "frontend"})
                        MERGE (t)-[:CONTAINS]->(s)
                        MERGE (s)-[:CONTAINS]->(r)
                    `, {
                        template: row.ItemName,
                        widget: widget,
                        slot: containingSlotName,
                        slotUid: widgetUid,
                        lang: row.Language,
                        pageUrl: row.PageUrl
                    });
                }
                if (row.PageUrl == options.trace || "all" == options.trace) {
                    console.log(`Creating relation between Template "${row.ItemName}" HAS SLOT Slot "${containingSlotName}" (${widgetUid})`);
                    console.log(`Creating relation between Slot "${containingSlotName}" (${widgetUid}) CONTAINS Widget "${widget}" (${widgetUid})`);
                }

            } else {

                if (row.PageUrl == options.trace || "all" == options.trace) {
                    console.log(`Creating relation between Slot "${containingSlotName}" (${widgetUid}) CONTAINS Widget "${widget}" (${widgetUid})`);
                }

                if (options.write) {
                    await session.run(`
                        MERGE (s:Slot {name: $slot, uid: $slotUid, webUrl: $pageUrl, lang: $lang, component: "frontend"})
                        MERGE (r:Widget {name: $widget, uid: $slotUid, webUrl: $pageUrl, lang: $lang, component: "frontend"})
                        MERGE (s)-[:CONTAINS]->(r)
                    `, {
                        widget: widget,
                        slot: containingSlotName,
                        slotUid: widgetUid,
                        lang: row.Language,
                        pageUrl: row.PageUrl
                    });

                    if (row.PageUrl == options.trace || "all" == options.trace) {
                        console.log(`Creating relation between Widget "${slots[containingSlotUid]}" (${containingSlotUid}) CONTAINS Slot "${containingSlotName}" (${widgetUid}) `);
                    }

                    if (slots[containingSlotUid]) {
                        await session.run(`
                        MERGE (s:Slot {name: $slot, uid: $slotUid, webUrl: $pageUrl, lang: $lang, component: "frontend"})
                        MERGE (rparent:Widget {name: $widgetParent, webUrl: $pageUrl, lang: $lang, uid: $containingSlotUid, component: "frontend"})
                        MERGE (rparent)-[:CONTAINS]->(s)
                    `, {
                            slot: containingSlotName,
                            slotUid: widgetUid,
                            widgetParent: slots[containingSlotUid],
                            containingSlotUid: containingSlotUid,
                            lang: row.Language,
                            pageUrl: row.PageUrl
                        });
                    }
                }

            }
        }
    }

    progressBar.stop();
}
    //delete everything first
    async function deleteAll(){ 
        await session.run(`MATCH (n)  DETACH DELETE n`)
    }

//delete everything first
if (options.clean)
    await session.run(`MATCH (n)  DETACH DELETE n`)

createGraphFromSitecore(pageComponentExport).then(() => {
    console.log(`Graph from ${pageComponentExport} data created successfully`)

    createGraphFromSitecore(pageComponentExportLayoutComponents).then(() => {
        console.log(`Graph from ${pageComponentExportLayoutComponents} data created successfully`)

    })
        .catch(console.error)
        .finally(() => driver.close());
})
    .catch(console.error)





