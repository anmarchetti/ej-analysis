#!/bin/bash
OUTPUT="./graph-visualizer/datasets.js"

echo "window.EMBEDDED_DATASETS = {" > $OUTPUT

echo "  renderings_analysis: {" >> $OUTPUT
echo "    id: 'renderings_analysis'," >> $OUTPUT
echo "    name: '📊 renderings_analysis.csv (Rendering ➔ Componenti ➔ API)'," >> $OUTPUT
echo "    file: 'data/renderings_analysis.csv'," >> $OUTPUT
echo "    type: 'rendering_analysis'," >> $OUTPUT
echo "    raw: \`" >> $OUTPUT
cat ./analysis/renderings_analysis.csv >> $OUTPUT
echo "\`" >> $OUTPUT
echo "  }," >> $OUTPUT

echo "  pageRendering: {" >> $OUTPUT
echo "    id: 'pageRendering'," >> $OUTPUT
echo "    name: '📄 pageRendering.csv (Gerarchia Sitecore Pagine ➔ Rendering)'," >> $OUTPUT
echo "    file: 'data/pageRendering.csv'," >> $OUTPUT
echo "    type: 'page_rendering'" >> $OUTPUT
echo "  }," >> $OUTPUT

echo "  PageRenderingApiPath: {" >> $OUTPUT
echo "    id: 'PageRenderingApiPath'," >> $OUTPUT
echo "    name: '🛣️ PageRenderingApiPath_new.csv (Percorso Completo Pagine ➔ API)'," >> $OUTPUT
echo "    file: 'data/PageRenderingApiPath_new.csv'," >> $OUTPUT
echo "    type: 'page_rendering_api'" >> $OUTPUT
echo "  }," >> $OUTPUT

echo "  RenderingApiRelations: {" >> $OUTPUT
echo "    id: 'RenderingApiRelations'," >> $OUTPUT
echo "    name: '🔗 RenderingApiRelations.csv (Relazioni Rendering ➔ API)'," >> $OUTPUT
echo "    file: 'data/RenderingApiRelations.csv'," >> $OUTPUT
echo "    type: 'rendering_api_rel'" >> $OUTPUT
echo "  }," >> $OUTPUT

echo "  PageApiRelations: {" >> $OUTPUT
echo "    id: 'PageApiRelations'," >> $OUTPUT
echo "    name: '⚡ PageApiRelations.csv (Relazioni Pagine ➔ API Dirette)'," >> $OUTPUT
echo "    file: 'data/PageApiRelations.csv'," >> $OUTPUT
echo "    type: 'page_api_rel'" >> $OUTPUT
echo "  }" >> $OUTPUT

echo "};" >> $OUTPUT

chmod +x ./graph-visualizer/generate_datasets.sh
./graph-visualizer/generate_datasets.sh
