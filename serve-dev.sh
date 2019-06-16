#!/bin/bash

source env/bin/activate

export FLASK_APP=serve.py
export FLASK_DEBUG=1

exec flask run
