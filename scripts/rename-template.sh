#!/bin/bash
# Usage: ./rename-template.sh NewProjectName
set -e
if [ -z "$1" ]; then
  echo "Usage: $0 NewProjectName"
  exit 1
fi
find . -type f -exec sed -i "s/vite-react-template/$1/g" {} +
find . -type f -exec sed -i "s/Vite React Template/$1/g" {} +
echo "Renamed project to $1. Please update package.json manually if needed."
