#!/bin/bash

# Tries to put a few things in the typedoc generated html files on their own line
# to make the changes easier to see, and to make the commits smaller

(
  IFS=$'\n'
  FILES=$(find ./docs/modules -iname '*.html')

  for F in $FILES; do
    echo "html file found: $F"
    sed --in-place 's|\(<a href="https://github\.com.*</a>\)|\n\1\n|g' "$F"
    # less "$F"
  done;
)