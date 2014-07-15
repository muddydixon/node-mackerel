# Mackerel node.js client [![Build Status](https://travis-ci.org/muddydixon/node-mackerel.svg?branch=master)](https://travis-ci.org/muddydixon/node-mackerel)

This module is node.js client for [Mackerel.io](https://mackerel.io/)

## Install

```shell
$ npm install mackerel
```

## Usage

Get Api Key by "Detail" page via [dashboard](https://mackerel.io/my/dashboard)

```coffee-script
Mackerel = require "mackerel"
mackerel = new Mackerel("your api key")

# use Promise
mackerel.getHosts()
.then(({res, body})->
  console.log body.hosts # hosts info array
)

# or callback function
mackerel.getHosts((err, res, body)->
  console.log body.hosts # hosts info array
)
```

## APIs

* `getHosts([callback])`
* `addHost(data[, callback])`
* `getHostInfo(id[, callback])`
* `updateHostInfo(id, data[, callback])`
* `changeHostStatus(id, status[, callback])`
* `retireHost(id[, callback])`
* `postMetric(data[, callback])`
* `postServiceMetric(service, data[, callback])`

See detail: [mackerel api specification](http://help-ja.mackerel.io/entry/spec/api/v0)

## TODOs

* stream post metric

## Author

@muddydixon <muddydixon@gmail.com>

## License

Apache License Version 2.0

## Contribute

```shell
git clone git@github.com:muddydixon/node-mackerel.git
cd node-mackerel
npm install
# and write code
```
