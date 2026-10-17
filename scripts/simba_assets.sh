#!/usr/bin/env bash
# Scarica le immagini ufficiali (miniature + fotogrammi YouTube) usate dal video 22simba.
# Le immagini non sono versionate: rilanciare questo script e poi scripts/simba_prepare.py.
set -e
mkdir -p tmp/stills && cd tmp/stills
IDS="MGWw9EnlhpA 8GhBEeGHS2Y s9EI_ImVr5E PGtcFvsae40 P0ZLHm7C6x0 2QHZ4OcHPIs HvJ2ejYSO_s KWGnk1DPGh4 t3nF9z8btAQ z50BJpSQ7WQ 0XIcEw3mLYA jRdhqbcLuO4 TkBmgXsPZFU ABuxdkNlOP4"
for id in $IDS; do for v in maxresdefault maxres1 maxres2 maxres3; do
  curl -s -f -o ${id}_$v.jpg https://i.ytimg.com/vi/$id/$v.jpg || rm -f ${id}_$v.jpg
done; done
