/**
 * Create Cloudflare DNS Record Action for GitHub
 * Originally forked from https://github.com/kriasoft/create-dns-record
 */

const path = require("path");
const cp = require("child_process");

const event = require(process.env.GITHUB_EVENT_PATH);
const pr = event.pull_request ? event.pull_request.number : "?";

let shouldBeProxied = true;
if (['false', '0', 'no'].includes(process.env.INPUT_PROXIED)) {
  shouldBeProxied = false;
}

//https://api.cloudflare.com/#dns-records-for-a-zone-list-dns-records
const getCurrentRecordId = () => {
  const { status, stdout } = cp.spawnSync("curl", [
    ...["--header", `Authorization: Bearer ${process.env.INPUT_TOKEN}`],
    ...["--header", "Content-Type: application/json"],
    `https://api.cloudflare.com/client/v4/zones/${process.env.INPUT_ZONE}/dns_records`,
  ]);
  const { success, result, errors } = JSON.parse(stdout.toString());
  const name = process.env.INPUT_NAME;
  const record = result.find((x) => x.name === name);

  if (status !== 0) {
    process.exit(status);
  }
  if (!success) {
    console.log(`::error ::${errors[0].message}`);
    process.exit(1);
  }
  if (!record) {
    return null
  }
  return record.id;
};

// https://api.cloudflare.com/#dns-records-for-a-zone-create-dns-record
const createRecord = () => {
  const { status, stdout } = cp.spawnSync("curl", [
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
  const { success, result, errors } = JSON.parse(stdout.toString());

  if (status !== 0) {
    process.exit(status);
  }
  if (!success) {
    console.dir(errors[0]);
    console.log(`::error ::${errors[0].message}`);
    process.exit(1);
  }
  console.log(`::set-output name=id::${result.id}`);
  console.log(`::set-output name=name::${result.name}`);
};

//https://api.cloudflare.com/#dns-records-for-a-zone-update-dns-record
const updateRecord = (id) => {
  console.log(`Record exists with ${id}, updating...`);
  const { status, stdout } = cp.spawnSync("curl", [
    ...["--request", "PUT"],
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
    `https://api.cloudflare.com/client/v4/zones/${process.env.INPUT_ZONE}/dns_records/${id}`,
  ]);
  const { success, result, errors } = JSON.parse(stdout.toString());

  if (status !== 0) {
    process.exit(status);
  }
  if (!success) {
    console.dir(errors[0]);
    console.log(`::error ::${errors[0].message}`);
    process.exit(1);
  }
  console.log(`::set-output name=record_id::${result.id}`);
  console.log(`::set-output name=name::${result.name}`);
}

const id = getCurrentRecordId();
if (id) {
  updateRecord(id);
  process.exit(0);
}
createRecord();