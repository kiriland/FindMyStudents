#!/bin/sh
# Next's standalone output reaches some server-external packages (the S3 SDK,
# sharp) through hashed symlinks in .next/node_modules. `aws lambda-web deploy`
# can't upload symlinks, so the deployed server can't find those packages.
# Replace each symlink with a copy of what it points to.
set -eu

dir=.next/standalone/.next/node_modules
if [ -d "$dir" ]; then
  cp -RL "$dir" "$dir.copy"
  rm -rf "$dir"
  mv "$dir.copy" "$dir"
fi

# Fail the build if any other symlink would be left out of the upload.
left=$(find .next/standalone -type l ! -path '*/.bin/*')
if [ -n "$left" ]; then
  echo "Symlinks the deploy would drop:" >&2
  echo "$left" >&2
  exit 1
fi
