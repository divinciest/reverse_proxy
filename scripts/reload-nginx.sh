#!/bin/sh
# certbot --deploy-hook: runs only after a certificate was actually issued or
# renewed. Validate first so a bad config never takes the proxy down.
set -eu

if nginx -t 2>/dev/null; then
    nginx -s reload
    echo "reload-nginx: reloaded for ${RENEWED_DOMAINS:-unknown domains}"
else
    echo "reload-nginx: nginx -t failed; not reloading" >&2
    nginx -t
    exit 1
fi
