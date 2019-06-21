#!/bin/bash

# exec >$HOME/log/fairXiv-update.log 2>&1

cd $HOME/fairXiv || exit 1
source env/bin/activate || exit 1

PYTHON="nice python -u"

$PYTHON fetch_papers.py --search-query="%28cat:cs.CV+OR+cat:cs.AI+OR+cat:cs.LG+OR+cat:cs.CL+OR+cat:cs.NE+OR+cat:cs.CY+OR+cat:stat.ML%29+AND+%28all:fairness+OR+all:ethical+all:ethics+all:safety%29" --max-index 2000 #--break-on-no-added 0
$PYTHON download_pdfs.py
$PYTHON parse_pdf_to_text.py
$PYTHON thumb_pdf.py
$PYTHON analyze.py
$PYTHON buildsvm.py
$PYTHON make_cache.py

systemctl --user reload fairXiv
