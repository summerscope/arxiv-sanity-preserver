#!/bin/bash

source env/bin/activate

exec python serve.py --prod --port 8080
