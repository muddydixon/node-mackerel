const assert = require("power-assert");
const sinon = require("sinon");
const request = require("request");
const NO_STUB = process.env.NO_STUB || false;
const APIKEY = "my_key";

const Mackerel = require("../lib/mackerel");

describe("Mackerel", ()=>{
  describe("constructor", ()=>{
    it("should throw Exception without api", ()=>{
      assert.throws(()=>{
        const mackerel = new Mackerel();
      }, (err)=>{
        assert.ok(err instanceof Mackerel.NoAPIKeyError);
        return true;
      });
    });
    it("should return mackerel with default value", ()=>{
      const mackerel = new Mackerel(APIKEY);
      assert.ok(mackerel.origin === "https://mackerel.io");
      assert.ok(mackerel.version === "v0");
    });
    it("should return specified mackerel with opt", ()=>{
      const origin = "https://mymackerel.io";
      const version = "myversion";
      const mackerel = new Mackerel(APIKEY, {origin, version});
      assert.ok(mackerel.origin === origin);
      assert.ok(mackerel.version === version);
    });
  });

  describe("api", ()=>{
    let _request = null;
    beforeEach(()=>{
      if(!NO_STUB) _request = sinon.stub(Mackerel.prototype, "request");
    });
    afterEach(()=>{
      if(!NO_STUB) _request.restore();
    });

    it("throw authentication failed for invalid api key", (done)=>{
      const mackerel = new Mackerel(APIKEY);
      if(!NO_STUB) _request.returns(Promise.reject(new Error("Authentication failed. Please try with valid Api Key.")));
      mackerel.getHosts().then(({res, body})=>{
        done(new Error("should fail"));
      }).catch((err)=>{
        assert.equal(err.message, "Authentication failed. Please try with valid Api Key.");
        done();
      });
    });

    it("return json with callback", (done)=>{
      const mackerel = new Mackerel(APIKEY);
      if(!NO_STUB) _request.returns(Promise.resolve({res: null, body: {hosts: []}}));
      mackerel.getHosts((err, res, body)=>{
        assert.deepEqual(body, {hosts: []});
        done();
      });
    });
  });

  describe("getHosts", ()=>{
    let _request = null;
    beforeEach(()=>{
      if(!NO_STUB) _request = sinon.stub(Mackerel.prototype, "request");
    });
    afterEach(()=>{
      if(!NO_STUB) _request.restore();
    });

    it("should return json", (done)=>{
      const mackerel = new Mackerel(APIKEY);
      if(!NO_STUB) _request.returns(Promise.resolve({res: {statusCode: 200}, body: {hosts: []}}));
      mackerel.getHosts().then(({res, body})=>{
        assert.equal(res.statusCode, 200);
        assert.deepEqual(body, {hosts: []});
        done();
      });
    });
  });

  describe("getHost", ()=>{
    let _request = null;
    beforeEach(()=>{
      if(!NO_STUB) _request = sinon.stub(Mackerel.prototype, "request");
    });
    afterEach(()=>{
      if(!NO_STUB) _request.restore();
    });

    it("should return json", (done)=>{
      const mackerel = new Mackerel(APIKEY);
      if(!NO_STUB) _request.returns(Promise.resolve({res: {statusCode: 200}, body: {host: {}}}));
      mackerel.addHost().then(({res, body})=>{
        assert.deepEqual(body, {host: {}});
        done();
      });
    });
  });

  describe("addHost", ()=>{
    let _request = null;
    beforeEach(()=>{
      if(!NO_STUB) _request = sinon.stub(Mackerel.prototype, "request");
    });
    afterEach(()=>{
      if(!NO_STUB) _request.restore();
    });

    it("should return json with new id", (done)=>{
      const mackerel = new Mackerel(APIKEY);
      if(!NO_STUB) _request.returns(Promise.resolve({res: {statusCode: 201}, body: {hosts: []}}));
      mackerel.addHost().then(({res, body})=>{
        assert.deepEqual(body, {hosts: []});
        done();
      });
    });
  });
});
