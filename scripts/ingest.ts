import { ingestSource } from "@/lib/ingestion/pipeline";

const source = process.argv[2] || "mock";

ingestSource(source)
  .then((result) => {
    console.log(JSON.stringify(result, null, 2));
    process.exit(0);
  })
  .catch((error: unknown) => {
    console.error(error);
    process.exit(1);
  });
