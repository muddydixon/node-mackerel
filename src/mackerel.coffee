"use strict"

request         = require "request"
deferred        = require "deferred"

#
# deferred request
#
dRequest        = ()->
  d = deferred()
  args = [].slice.apply arguments

  args.push (err, res, body)->
    d.reject err if err
    d.resolve {res, body}
  request.apply(request, args)

  d.promise

module.exports = class Mackerel
  @origin: "https://mackerel.io"
  constructor: (@apikey, @option = {})->
    @origin   = @option.mackerelOrigin or Mackerel.origin
    @version  = @option.version or "v0"
    @type     = @option.type or ".json"
    @endpoint = "#{@origin}/api/#{@version}"

  api: (path, method, body)->
    cb = arguments.pop() if typeof arguments[arguments.length - 1] is "function"
    opt =
      method:   method
      url:      "#{@endpoint}#{path}"
      proxy:    @option.proxy
      headers:
        "X-Api-Key": @apikey
    opt.body = JSON.stringify body if body
    opt.headers["Content-Type"] = "application/json" if @type is ".json"

    d = dRequest(opt)
    .then(({res, body})=>
      if @type is ".json"
        body = JSON.parse body
      {res, body}
    )
    if cb
      d.then(({res, body})->
        cb(null, res, body)
      )
      .catch(cb)
    else
      d

  getHosts: (cb)->
    @api("/hosts#{@type}", "GET", cb)

  addHost: (data = {}, cb)->
    @api("/hosts", "POST", data, cb)

  getHostInfo: (id, cb)->
    @api("/hosts/#{id}", "GET", cb)

  updateHostInfo: (id, data = {}, cb)->
    @api("/hosts/#{id}", "PUT", data, cb)

  changeHostStatus: (id, status, cb)->
    # TODO check data
    @api("/hosts/#{id}/status", "POST", {status: status}, cb)

  retireHost: (id, cb)->
    @api("/hosts/#{id}/retire", "POST", {}, cb)

  postMetric: (data = [], cb)->
    @api("/tsdb", "POST", data, cb)


class Mackerel::NoApiKeyError extends Error
  constructor: (msg)->
    @message = "api key required" + (msg? and msg or "")
    super(@message)
