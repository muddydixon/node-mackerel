"use strict";
var Mackerel, deferred, request,
  __hasProp = {}.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

request = require("request");

deferred = require("deferred");

module.exports = Mackerel = (function() {
  Mackerel.origin = "https://mackerel.io";

  Mackerel.statuses = ["standby", "working", "maintenance", "retuired"];

  function Mackerel(apikey, option) {
    this.apikey = apikey;
    this.option = option != null ? option : {};
    if (!this.apikey) {
      throw new Mackerel.NoApiKeyError;
    }
    this.origin = this.option.mackerelOrigin || Mackerel.origin;
    this.version = this.option.version || "v0";
    this.endpoint = "" + this.origin + "/api/" + this.version;
  }

  Mackerel.prototype.api = function(path, method, body) {
    var args, cb, d, opt;
    args = [].slice.apply(arguments);
    if ((args[args.length - 1] != null) && typeof args[args.length - 1] === "function") {
      cb = args.pop();
    }
    opt = {
      method: method,
      url: "" + this.endpoint + path,
      proxy: this.option.proxy,
      headers: {
        "X-Api-Key": this.apikey
      }
    };
    if (body) {
      opt.body = JSON.stringify(body);
    }
    opt.headers["Content-Type"] = "application/json";
    d = Mackerel.request(opt).then((function(_this) {
      return function(_arg) {
        var body, res;
        res = _arg.res, body = _arg.body;
        if (res.statusCode === 401) {
          throw new Mackerel.AuthenticationError(body.error);
        }
        if (res.statusCode >= 400) {
          throw new Mackerel.ApiError(body);
        }
        body = JSON.parse(body);
        return {
          res: res,
          body: body
        };
      };
    })(this));
    if (cb) {
      return d.then(function(_arg) {
        var body, res;
        res = _arg.res, body = _arg.body;
        return cb(null, res, body);
      })["catch"](cb);
    } else {
      return d;
    }
  };

  Mackerel.prototype.getHosts = function(cb) {
    return this.api("/hosts.json", "GET", cb);
  };

  Mackerel.prototype.addHost = function(data, cb) {
    if (!data) {
      return deferred(new Mackerel.NoDataError("addHost"));
    }
    return this.api("/hosts", "POST", data, cb);
  };

  Mackerel.prototype.getHostInfo = function(id, cb) {
    if (!id) {
      return deferred(new Mackerel.NoIdError("getHostInfo"));
    }
    return this.api("/hosts/" + id, "GET", cb);
  };

  Mackerel.prototype.updateHostInfo = function(id, data, cb) {
    if (!id) {
      return deferred(new Mackerel.NoIdError("updateHostInfo"));
    }
    if (!data) {
      return deferred(new Mackerel.NoDataError("updateHostInfo"));
    }
    return this.api("/hosts/" + id, "PUT", data, cb);
  };

  Mackerel.prototype.changeHostStatus = function(id, status, cb) {
    if (!id) {
      return deferred(new Mackerel.NoIdError("changeHostStatus"));
    }
    if (Mackerel.statuses.indexOf(status) === -1) {
      return deferred(new Mackerel.InvalidStatusError(status));
    }
    return this.api("/hosts/" + id + "/status", "POST", {
      status: status
    }, cb);
  };

  Mackerel.prototype.retireHost = function(id, cb) {
    if (!id) {
      return deferred(new Mackerel.NoIdError("retireHost"));
    }
    return this.api("/hosts/" + id + "/retire", "POST", {}, cb);
  };

  Mackerel.prototype.postMetric = function(data, cb) {
    if (!data) {
      return deferred(new Mackerel.NoDataError("postMetric"));
    }
    return this.api("/tsdb", "POST", data, cb);
  };

  Mackerel.request = function() {
    var args, d;
    d = deferred();
    args = [].slice.apply(arguments);
    args.push(function(err, res, body) {
      if (err) {
        d.reject(err);
      }
      return d.resolve({
        res: res,
        body: body
      });
    });
    request.apply(request, args);
    return d.promise;
  };

  return Mackerel;

})();

Mackerel.ApiError = (function(_super) {
  __extends(ApiError, _super);

  function ApiError(obj) {
    this.message = JSON.stringify(obj);
    ApiError.__super__.constructor.call(this, this.message);
  }

  return ApiError;

})(Error);

Mackerel.NoApiKeyError = (function(_super) {
  __extends(NoApiKeyError, _super);

  function NoApiKeyError(msg) {
    this.message = "api key required" + ((msg != null) && msg || "");
    NoApiKeyError.__super__.constructor.call(this, this.message);
  }

  return NoApiKeyError;

})(Error);

Mackerel.AuthenticationError = (function(_super) {
  __extends(AuthenticationError, _super);

  function AuthenticationError(msg) {
    this.message = "authentication failed" + ((msg != null) && msg || "");
    AuthenticationError.__super__.constructor.call(this, this.message);
  }

  return AuthenticationError;

})(Error);

Mackerel.NoDataError = (function(_super) {
  __extends(NoDataError, _super);

  function NoDataError(api) {
    this.message = "api `" + api + "` requires `data`";
    NoDataError.__super__.constructor.call(this, this.message);
  }

  return NoDataError;

})(Error);

Mackerel.NoIdError = (function(_super) {
  __extends(NoIdError, _super);

  function NoIdError(api) {
    this.message = "api `" + api + "` requires `id`";
    NoIdError.__super__.constructor.call(this, this.message);
  }

  return NoIdError;

})(Error);

Mackerel.InvalidStatusError = (function(_super) {
  __extends(InvalidStatusError, _super);

  function InvalidStatusError(status) {
    this.message = "`" + status + "` is invalid";
    InvalidStatusError.__super__.constructor.call(this, this.message);
  }

  return InvalidStatusError;

})(Error);
