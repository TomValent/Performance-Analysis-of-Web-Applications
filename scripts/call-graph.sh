#!/bin/bash

printf 'y\n' | npx tcg src/*.ts || { echo 'Call graph generation failed' ; exit 1;}
