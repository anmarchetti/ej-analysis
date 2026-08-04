import fs from "fs";
import OpenAI from "openai";

const openai = new OpenAI({
    apiKey: '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'
});

async function uploadBatchFile() {
    const file = await openai.files.create({
        file: fs.createReadStream("./data/batchinput.jsonl"),
        purpose: "batch",
    });

    console.log(file);
    return file.id;
}

async function createBatchJob(fileid) {
    const batch = await openai.batches.create({
        input_file_id: fileid,
        endpoint: "/v1/chat/completions",
        completion_window: "24h"
    });

    console.log(batch);
    return batch;
}

const fileid = await uploadBatchFile();
await createBatchJob(fileid)
