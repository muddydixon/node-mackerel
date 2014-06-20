"use strict"

deferred        = require "deferred"
{expect}        = require "chai"
sinon           = require "sinon"

Mackerel        = require "../src/mackerel"

describe "Mackerel", ->
  describe "constructor", ->
    it "throw Error", ->
      expect(->
        new Mackerel()
      ).throw Mackerel::NoApiKeyError

    it "return Mackerel", ->
      expect(new Mackerel("my key")).to.be.an.instanceof Mackerel

  describe "api", ->
    request = null
    before ->
      request = sinon.stub(Mackerel, "request")
    after ->
      delete require.cache["request"]

    it "throw authentication failed for invalid api key", (done)->
      mackerel = new Mackerel("my key")
      request.returns(deferred({res: {statusCode: 401}, body: "Authentication failed"}))
      mackerel.getHosts()
      .then(({res, body})->
        done new Error("should throw error")
      )
      .catch((err)->
        expect(err).to.be.an.instanceof Mackerel::AuthenticationError
        done()
      )

    describe "getHosts", ->
      mackerel = new Mackerel("my key")
      it "return JSON with `hosts`", (done)->
        request.returns(deferred({res: {statusCode: 200}, body: JSON.stringify({ hosts: [] })}))
        mackerel.getHosts()
        .then(({res, body})->
          expect(body).to.have.property "hosts"
          done()
        )

    describe "addHost", ->
      mackerel = new Mackerel("my key")
      it "return JSON with `id`", (done)->
        request.returns(deferred({res: {statusCode: 200}, body: JSON.stringify({ id: "hostId" })}))
        mackerel.addHost({name: "my-host", meta: {}, interface: {}})
        .then(({res, body})->
          expect(body).to.have.property "id", "hostId"
          done()
        )

      it "throw error withou host data", (done)->
        mackerel.addHost()
        .catch((err)->
          expect(err).to.be.an.instanceof Mackerel::NoDataError
          done()
        )

      it "throw ApiError without name", (done)->
        body = {error: {'obj.name': [ { msg: 'error.path.missing', args: [] } ]}}
        request.returns(deferred({res: {statusCode: 400}, body: JSON.stringify(body)}))
        mackerel.addHost({meta: {}})
        .then(({res, body})->
          done(new Error("should throw error"))
        )
        .catch((err)->
          expect(err).to.be.an.instanceof Mackerel::ApiError
          done()
        )

      it "throw ApiError without meta", (done)->
        body = {error: {'obj.meta': [ { msg: 'error.path.missing', args: [] } ]}}
        request.returns(deferred({res: {statusCode: 400}, body: JSON.stringify(body)}))
        mackerel.addHost({name: "my-host"})
        .then(({res, body})->
          done(new Error("should throw error"))
        )
        .catch((err)->
          expect(err).to.be.an.instanceof Mackerel::ApiError
          done()
        )

    describe "getHostInfo", ->
      mackerel = new Mackerel("my key")
      it "return JSON with `host`", (done)->
        request.returns(deferred({res: {statusCode: 200}, body: JSON.stringify({ host: {} })}))
        mackerel.getHosts("my-host")
        .then(({res, body})->
          expect(body).to.have.property "host"
          done()
        )

      it "throw error without id", (done)->
        mackerel.getHostInfo()
        .catch((err)->
          expect(err).to.be.an.instanceof Mackerel::NoIdError
          done()
        )

      it "throw ApiError for no host", (done)->
        body = "Host Not Found"
        request.returns(deferred({res: {statusCode: 404}, body: JSON.stringify(body)}))
        mackerel.addHost({name: "my-host"})
        .then(({res, body})->
          done(new Error("should throw error"))
        )
        .catch((err)->
          expect(err).to.be.an.instanceof Mackerel::ApiError
          done()
        )

    describe "updateHostInfo", ->
      mackerel = new Mackerel("my key")
      it "return JSON with `host`", (done)->
        request.returns(deferred({res: {statusCode: 200}, body: JSON.stringify({ id: "my-host" })}))
        mackerel.updateHostInfo("my-host", {name: "my-host", meta: {}})
        .then(({res, body})->
          expect(body).to.have.property "id", "my-host"
          done()
        )

      it "throw error without id", (done)->
        mackerel.updateHostInfo()
        .catch((err)->
          expect(err).to.be.an.instanceof Mackerel::NoIdError
          done()
        )

      it "throw error without data", (done)->
        mackerel.updateHostInfo("my-host")
        .catch((err)->
          expect(err).to.be.an.instanceof Mackerel::NoDataError
          done()
        )

      it "throw ApiError for no host", (done)->
        body = "Host Not Found"
        request.returns(deferred({res: {statusCode: 404}, body: JSON.stringify(body)}))
        mackerel.updateHostInfo({name: "my-host"}, {})
        .then(({res, body})->
          done(new Error("should throw error"))
        )
        .catch((err)->
          expect(err).to.be.an.instanceof Mackerel::ApiError
          done()
        )

      it "throw ApiError without name", (done)->
        body = {error: {'obj.name': [ { msg: 'error.path.missing', args: [] } ]}}
        request.returns(deferred({res: {statusCode: 400}, body: JSON.stringify(body)}))
        mackerel.updateHostInfo("my-host", {meta: {}})
        .then(({res, body})->
          done(new Error("should throw error"))
        )
        .catch((err)->
          expect(err).to.be.an.instanceof Mackerel::ApiError
          done()
        )

      it "throw ApiError without meta", (done)->
        body = {error: {'obj.meta': [ { msg: 'error.path.missing', args: [] } ]}}
        request.returns(deferred({res: {statusCode: 400}, body: JSON.stringify(body)}))
        mackerel.updateHostInfo("my-host", {name: "my-host"})
        .then(({res, body})->
          done(new Error("should throw error"))
        )
        .catch((err)->
          expect(err).to.be.an.instanceof Mackerel::ApiError
          done()
        )

    describe "changeHostStatus", ->
      mackerel = new Mackerel("my key")
      it "return JSON with `hosts`", (done)->
        request.returns(deferred({res: {statusCode: 200}, body: JSON.stringify({ status: "working" })}))
        mackerel.changeHostStatus("my-host", "working")
        .then(({res, body})->
          expect(body).to.have.property "status", "working"
          done()
        )

      it "throw error without id", (done)->
        mackerel.changeHostStatus()
        .catch((err)->
          expect(err).to.be.an.instanceof Mackerel::NoIdError
          done()
        )

      it "throw error invalid status", (done)->
        mackerel.changeHostStatus("my-host", "excite")
        .catch((err)->
          expect(err).to.be.an.instanceof Mackerel::InvalidStatusError
          done()
        )

      it "throw ApiError for no host", (done)->
        body = "Host Not Found"
        request.returns(deferred({res: {statusCode: 404}, body: JSON.stringify(body)}))
        mackerel.changeHostStatus("no-host", "working")
        .then(({res, body})->
          done(new Error("should throw error"))
        )
        .catch((err)->
          expect(err).to.be.an.instanceof Mackerel::ApiError
          done()
        )

    describe "retireHost", ->
      mackerel = new Mackerel("my key")
      it "return JSON `{}`", (done)->
        request.returns(deferred({res: {statusCode: 200}, body: JSON.stringify({success: true})}))
        mackerel.retireHost("my-host")
        .then(({res, body})->
          expect(body).to.have.property "success", true
          done()
        )

      it "throw error without id", (done)->
        mackerel.retireHost()
        .catch((err)->
          expect(err).to.be.an.instanceof Mackerel::NoIdError
          done()
        )

      it "throw ApiError for no host", (done)->
        body = "Host Not Found"
        request.returns(deferred({res: {statusCode: 404}, body: JSON.stringify(body)}))
        mackerel.retireHost("no-host")
        .then(({res, body})->
          done(new Error("should throw error"))
        )
        .catch((err)->
          expect(err).to.be.an.instanceof Mackerel::ApiError
          done()
        )

    describe "postMetric", ->
      mackerel = new Mackerel("my key")
      now = Date.now()
      data = [0...10].map (id)->
        hostId: "27CX4g2ibtA"
        name: "my-metric.value"
        time: 0|(new Date(now + id * 60 * 1000).getTime() / 1000)
        value: 0|Math.random() * 100

      it "return JSON `{}`", (done)->
        request.returns(deferred({res: {statusCode: 200}, body: JSON.stringify({success: true})}))
        mackerel.postMetric(data)
        .then(({res, body})->
          expect(body).to.have.property "success", true
          done()
        )

      it "throw error witout data", (done)->
        mackerel.postMetric()
        .catch((err)->
          expect(err).to.be.an.instanceof Mackerel::NoDataError
          done()
        )
