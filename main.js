/**
 * Create DNS Record Action for GitHub
 * https://github.com/marketplace/actions/create-dns-record
 */

const path = require("path");
const cp = require("child_process");

const event = require(process.env.GITHUB_EVENT_PATH);
const pr = event.pull_request ? event.pull_request.number : "?";

let shouldBeProxied = true;
if (['false', '0', 'no'].includes(process.env.INPUT_PROXIED)) {
  shouldBeProxied = false;
}

// https://api.cloudflare.com/#dns-records-for-a-zone-create-dns-record
const curlResult = cp.spawnSync("curl", [
  ...["--request", "POST"],
  ...["--header", `Authorization: Bearer ${process.env.INPUT_TOKEN}`],
  ...["--header", "Content-Type: application/json"],
  ...["--silent", "--data"],
  JSON.stringify({
    type: process.env.INPUT_TYPE,
    name: process.env.INPUT_NAME.replace(/\{pr\}/gi, pr)
      .replace(/\{pr_number\}/gi, pr)
      .replace(/\{head_ref\}/gi, process.env.GITHUB_HEAD_REF),
    content: process.env.INPUT_CONTENT,
    ttl: Number(process.env.INPUT_TTL),
    proxied: shouldBeProxied,
  }),
  `https://api.cloudflare.com/client/v4/zones/${process.env.INPUT_ZONE}/dns_records`,
]);

if (curlResult.status !== 0) {
  process.exit(curlResult.status);
}

const { success, result, errors } = JSON.parse(curlResult.stdout.toString());

if (!success) {
  console.dir(errors[0]);
  console.log(`::error ::${errors[0].message}`);
  process.exit(1);
}

console.dir(result);
console.log(`::set-output name=id::${result.id}`);
console.log(`::set-output name=name::${result.name}`);
