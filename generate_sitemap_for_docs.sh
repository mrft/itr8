#!/bin/sh

BASE_URL=https://mrft.github.io/itr8

# generate a simple text filemap for google
(
  cd docs \
    && find . -iname '*.html' \
     | grep --invert-match 'docs/google.*html' \
     | sed "s|\./|${BASE_URL}/|g" > sitemap.txt
)