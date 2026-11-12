#!/usr/bin/env bash
set -euo pipefail

repo_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
infra_dir="$repo_dir/infrastructure/course-importer"

for dependency in node npm terraform aws; do
  command -v "$dependency" >/dev/null || { echo "Missing required command: $dependency" >&2; exit 1; }
done
node -e 'if (Number(process.versions.node.split(".")[0]) < 24) throw new Error("Use Node.js 24 or newer.")'
aws sts get-caller-identity --query '{Account:Account,Arn:Arn}' --output json --no-cli-pager

npm ci --prefix "$repo_dir/services/course-importer" --no-audit --no-fund
npm run build --prefix "$repo_dir/services/course-importer"
terraform -chdir="$infra_dir" init -input=false
terraform -chdir="$infra_dir" apply "$@"

console_url="$(terraform -chdir="$infra_dir" output -raw lambda_console_url)"
echo "Lambda console: $console_url"
if [[ "${OPEN_AWS_CONSOLE:-1}" == "1" ]]; then
  if command -v open >/dev/null; then open "$console_url" || true
  elif command -v xdg-open >/dev/null; then xdg-open "$console_url" || true
  fi
fi

if [[ "${SKIP_INITIAL_SYNC:-0}" != "1" ]]; then
  echo "Running the initial catalog sync. Existing course records may be updated."
  node "$repo_dir/scripts/sync-courses.mjs"
fi
