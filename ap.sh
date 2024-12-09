#!/bin/bash

# Check if a commit message was provided
if [ -z "$1" ]; then
    echo "Error: Please provide a commit message"
    echo "Usage: ./git_pa.sh \"your commit message\""
    exit 1
fi

# Execute git commands
git add .
git commit -m "$1"
git push

# Check if any of the commands failed
if [ $? -eq 0 ]; then
    echo "Successfully added, committed, and pushed changes"
else
    echo "An error occurred during the git operations"
fi