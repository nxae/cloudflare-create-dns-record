# Create DNS Record Action for GitHub

Creates a new CloudFlare DNS record.

## Usage

Inside ```[project_root]/.github/workflows/[cf-create-dns].yaml``` create or include below lines in repo's workflow file 

```yaml
name: CI creating CF DNS record
on:
  pull_request:
    type: [opened, reopened, syncronized]
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: nxae/cloudflare-create-dns-record@v4
        with:
          type: "CNAME"
          name: "{PR}-review.${{ secrets.DOMAIN }}"
          content: "${{ secrets.DOMAIN }} "
          ttl: 1  
          proxied: true
          token: ${{ secrets.CLOUDFLARE_TOKEN }}
          zone: ${{ secrets.CLOUDFLARE_ZONE }}
```

## License

The scripts and documentation in this project are released under the [MIT License](LICENSE).
