#!/bin/bash

FEATURES_DIR="features"

while true; do
  read -p "Enter tag to run (e.g. @sample): " TAG

  # Prepend @ if user forgot it
  [[ "$TAG" != @* ]] && TAG="@$TAG"

  # Search for the tag in all feature files
  if grep -rq "$TAG" "$FEATURES_DIR" --include="*.feature"; then
    echo "Running tests for tag: $TAG"
    ./node_modules/.bin/bddgen --tags "$TAG" && ./node_modules/.bin/playwright test
    break
  else
    echo "Tag '$TAG' not found in any feature file. Please try again."
    echo ""
  fi
done
