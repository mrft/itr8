#!/bin/bash

# Tries to put a few things in the typedoc generated html files on their own line
# to make the changes easier to see, and to make the commits smaller
echo "[optimize_generated_docs_for_git.sh] Exiting without doing anything"
exit 0

(
  IFS=$'\n'
  FILES=$(find ./docs -iname '*.html')

  for F in $FILES; do
    # echo "html file found: $F"
    # sed --in-place 's|\(<a href="https://github\.com[^<]*</a>\)|\n\1\n|g' "$F"

    ### the next fix will actually change the visualization! (which I think is strange)
    # echo "${F}: replacing any <br/> not on the end of a line with <br/>\\n"
    # sed --in-place 's|<br/>\(.\)|<br/>\n\1|g' "${F}"

    # less "$F"
  done;
)