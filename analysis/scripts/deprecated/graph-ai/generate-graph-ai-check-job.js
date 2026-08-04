import OpenAI from "openai";
const batchId = process.argv[2]

console.log('batchid: ' + batchId)

const openai = new OpenAI({
    apiKey: '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'
});

async function main() {
  const batch = await openai.batches.retrieve(batchId);

  console.log(batch)
}

main();