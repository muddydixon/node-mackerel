"use strict"

request         = require "request"
deferred        = require "deferred"

module.exports = class Mackerel
  @origin: "https://mackerel.io"
  @statuses: ["standby", "working", "maintenance", "retuired"]
  constructor: (@apikey, @option = {})->
    throw new Mackerel.NoApiKeyError unless @apikey

    @origin   = @option.mackerelOrigin or Mackerel.origin
    @version  = @option.version or "v0"
    @endpoint = "#{@origin}/api/#{@version}"

  api: (path, method, body)->
    args = [].slice.apply arguments
    cb = args.pop() if args[args.length - 1]? and typeof args[args.length - 1] is "function"
    opt =
      method:   method
      url:      "#{@endpoint}#{path}"
      proxy:    @option.proxy
      headers:
        "X-Api-Key": @apikey
    opt.body = JSON.stringify body if body
    opt.headers["Content-Type"] = "application/json"

    d = Mackerel.request(opt)
    .then(({res, body})=>
      throw new Mackerel.AuthenticationError(body.error) if res.statusCode is 401
      throw new Mackerel.ApiError(body) if res.statusCode >= 400
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
    @api("/hosts.json", "GET", cb)

  addHost: (data, cb)->
    return deferred(new Mackerel.NoDataError("addHost")) unless data
    @api("/hosts", "POST", data, cb)

  getHostInfo: (id, cb)->
    return deferred(new Mackerel.NoIdError("getHostInfo")) unless id
    @api("/hosts/#{id}", "GET", cb)

  updateHostInfo: (id, data, cb)->
    return deferred(new Mackerel.NoIdError("updateHostInfo")) unless id
    return deferred(new Mackerel.NoDataError("updateHostInfo")) unless data
    @api("/hosts/#{id}", "PUT", data, cb)

  changeHostStatus: (id, status, cb)->
    return deferred(new Mackerel.NoIdError("changeHostStatus")) unless id
    return deferred(new Mackerel.InvalidStatusError(status)) if Mackerel.statuses.indexOf(status) is -1
    @api("/hosts/#{id}/status", "POST", {status: status}, cb)

  retireHost: (id, cb)->
    return deferred(new Mackerel.NoIdError("retireHost")) unless id
    @api("/hosts/#{id}/retire", "POST", {}, cb)

  postMetric: (data, cb)->
    return deferred(new Mackerel.NoDataError("postMetric")) unless data
    return deferred(new Mackerel.NoArrayDataError("postMetric")) unless data instanceof Array
    @api("/tsdb", "POST", data, cb)

  postServiceMetric: (service, data, cb)->
    return deferred(new Mackerel.NoDataError("postServiceMetric")) unless data
    return deferred(new Mackerel.NoArrayDataError("postServiceMetric")) unless data instanceof Array
    @api("/services/#{service}/tsdb", "POST", data, cb)

  #
  # ## deferred request
  #
  @request = ()->
    d = deferred()
    args = [].slice.apply arguments

    args.push (err, res, body)->
      d.reject err if err
      d.resolve {res, body}
    request.apply(request, args)

    d.promise

class Mackerel.ApiError extends Error
  constructor: (obj)->
    @message = JSON.stringify(obj)
    super(@message)

class Mackerel.NoApiKeyError extends Error
  constructor: (msg)->
    @message = "api key required" + (msg? and msg or "")
    super(@message)

class Mackerel.AuthenticationError extends Error
  constructor: (msg)->
    @message = "authentication failed" + (msg? and msg or "")
    super(@message)

class Mackerel.NoDataError extends Error
  constructor: (api)->
    @message = "api `#{api}` requires `data`"
    super(@message)

class Mackerel.NoArrayDataError extends Error
  constructor: (api)->
    @message = "api `#{api}` requires Array `data`"
    super(@message)

class Mackerel.NoIdError extends Error
  constructor: (api)->
    @message = "api `#{api}` requires `id`"
    super(@message)

class Mackerel.InvalidStatusError extends Error
  constructor: (status)->
    @message = "`#{status}` is invalid"
    super(@message)
