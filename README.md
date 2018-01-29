# Dependency Manager

Manages dependencies

Author: Trideep Gogoi

## Prerequisites
THis application runs on Node.js

## Usage

### Instructions for use:

#### Installing
Clone the repo
```
git clone https://github.com/trideepgogoi/brigadesolution.git
cd brigadesolution/
```

Running the program
The Program can be run in two ways and requires the use of node.js.


1. Interactive Mode:
```
node dependencymanager.js
```
This mode allows you to input the Commands in the terminal.

2. Provide a list of dependencies as a file (Example file attached: filelist.txt)
```
node dependencymanager.js < filelist.txt
```
This mode takes input in the form of a standard UNIX input stream. In this example filelist.txt is assumed to be the list of input commands.
