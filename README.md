# hello-world-acp

## To work with ACP only the https://pod.inrupt.com Pods are compatible so I suggest you create one to test at https://signup.pod.inrupt.com/

## Right now the web app reads and writes well data from / to a Pod on https://pod.inrupt.com

## Then I was working with the ACP packages (https://docs.inrupt.com/developer-tools/api/javascript/solid-client/modules/acp_acp.html) to try to fetch a resource and apply a rule / policy to it but so far without success (check the error on the command line when you build)
## The main source of code of this part is in the function getResourcePolicy() on the file src/index.js

## Instalation

You need to have installed: node & npm

Then install Inrupt packages: npm install @inrupt/solid-client @inrupt/solid-client-authn-browser @inrupt/vocab-common-rdf

Then install web dev packages: npm install webpack webpack-cli webpack-dev-server css-loader style-loader --save-dev

## Build

npm run build && npm run start

The project should then be running at http://localhost:8080/
