#!/bin/bash

FEATURES_DIR="features"

matches=$(grep -rl "@only" "$FEATURES_DIR" --include="*.feature")

if [ -n "$matches" ]; then
  echo "Commit blocked: @only tag found in the following feature file(s):"
  echo "$matches" | sed 's/^/  /'
  echo ""
  echo "Remove @only before committing — it compiles to test.only() and silently skips all other tests."
  exit 1
fi
