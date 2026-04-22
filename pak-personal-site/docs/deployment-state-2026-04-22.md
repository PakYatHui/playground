# Deployment State: 2026-04-22

## Summary

- The site is deployed as a static export generated from the local source tree.
- Final hostname: `https://pakagent.dpdns.org`
- The deployment is isolated from `https://manager.pakagent.dpdns.org`

## Runtime shape

- Deployment target VM: `repair-manager_`
- Static site root: `/srv/pak-personal-site`
- Local site service: `pak-personal-site.service`
- Local bind: `127.0.0.1:3001`
- Tunnel name: `pak-personal-site`

## Isolation rules

- Do not reuse `manager-vm`
- Do not reuse `manager-site.service`
- Do not reuse manager tunnel credentials or manager content roots
- Do not modify `manager.pakagent.dpdns.org` during personal-site updates

## Unresolved items

- Resume is still placeholder-only
- Local source still uses `next@15.3.2` and should be patched before the next rebuild
