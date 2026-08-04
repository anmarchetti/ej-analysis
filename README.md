# EasyJet Holidays Ark Revision



## Getting started

The codebase is composed by:

- codebase
- - frontend
- - - app_: main fe application, uses next and jss-sitecore sdk
- - - Prototypes: style only project that creates a unique css file for the fe application
- - backend
- analysis: root of analys tools
- - scripts: analysis scripts
- docusaurus: documentation of the front-end application (auto-generated with gpt)

### Init Neo4J DB

1. Install Docker
2. Move to analysis/neo4j folder and run
```
docker compose up -d
```
3. Find neo4j dashboard at http://localhost:7474/browser/ 

### Run relation creation script

1. Move to scripts folder and run graph generation from codebase
```
npm i
node generate-graph.js
```

if you want to debug use
```
node generate-graph.js true {name of the file to trace info about}
```

2. Run script to create nodes from sitecore export
```
node extract-sitecore-info.js
```


### Run docusaurus docs generation

1. Move to scripts docusaurus and run
```
npm i
node generate-docs.js
```

It will try to generate all documentation files if they are not already present. If you want to update specific doc, delete it and run the script.

2. Run docusaurus 
```
npm run build
npm run serve
```
Build will also create the local search index. If you run `npm run start` you will be in dev mode and hot reload is enabled, but search is disabled.
