const qs = require("querystring");
const request = require("request");
const createError = require("create-error");

const ORIGIN = "https://mackerel.io";
const VERSION = "v0";
const GET = "GET",
      POST = "POST",
      PUT = "PUT",
      DELETE = "DELETE";

class Mackerel {

  constructor(apikey, options = {}) {
    if (!apikey) throw new Mackerel.NoAPIKeyError();
    this.apikey = apikey;
    this.origin = options.origin || ORIGIN;
    this.version = options.version || VERSION;
    this.endpoint = `${this.origin}/api/${this.version}`;
    this.proxy = options.proxy || undefined;
  }

  request(path, method, data) {
    const opt = {
      method,
      url: `${this.endpoint}${path}`,
      headers: {
        "X-Api-Key": this.apikey,
        contentType: "application/json",
        accepts: "application/json"
      },
      form: null
    };
    if (this.proxy) opt.proxy = this.proxy;

    const reqData = JSON.stringify(data || {});
    if ([GET, DELETE].indexOf(method) > -1) {
      opt.url = `${opt.url}?${reqData}`;
    } else if ([POST, PUT].indexOf(method) > -1) {
      opt.form = reqData;
    }

    return new Promise((resolve, reject) => {
      return request[method.toLowerCase()](opt, (err, res, body) => {
        const jsonBody = JSON.parse(body || "{}");
        if (res.statusCode >= 400) {
          return reject(new Error(jsonBody.error || "unknown err"));
        }
        if (err) return reject(err);
        return resolve({ res, body });
      });
    });
  }

  api(path, method, data, cb) {
    return this.request(path, method, data).then(({ res, body }) => {
      return cb ? cb(null, res, body) : { res, body };
    }).catch(err => {
      if (cb) return cb(err);
      throw err;
    });
  }

  // services
  getServices(cb) {
    return this.api("/services", GET, null, cb);
  }
  getRoles(serviceName, cb) {
    return this.api(`/services/${serviceName}/roles`, GET, null, cb);
  }
  getTags(serviceName, cb) {
    return this.api(`/services/${serviceName}/tags`, GET, null, cb);
  }

  // hosts
  addHost(hostInfo, cb) {
    return this.api(`/hosts`, POST, hostInfo, cb);
  }
  getHosts(cb) {
    return this.api(`/hosts`, GET, null, cb);
  }
  getHost(hostId, cb) {
    return this.api(`/hosts/${hostId}`, GET, null, cb);
  }
  modifyHost(hostInfo, cb) {
    return this.api(`/hosts`, PUT, hostInfo, cb);
  }
  modifyHostStatus(hostId, status, cb) {
    return this.api(`/hosts/${hostId}/status`, POST, { status }, cb);
  }
  modifyHostRole(hostId, roles, cb) {
    roles = Array.isArray(roles) ? roles : [roles];
    return this.api(`/hosts/${hostId}/role-fullnames`, PUT, { roleFullnames: roles }, cb);
  }
  retireHost(hostId, cb) {
    return this.api(`/hosts/${hostId}/retire`, POST, {}, cb);
  }
  getHostMetrics(hostId, cb) {
    return this.api(`/hosts/${hostId}/metric-names`, GET, null);
  }

  // host metrics
  postMetrics(metrics, cb) {
    metrics.forEach(metric => {
      metric.time = metric.time ? metric.time : 0 | Date.now() / 1000;
    });
    return this.api(`/tsdb`, POST, metrics, null);
  }
  getHostMetric(hostId, name, from, to, cb) {
    return this.api(`/hosts/${hostId}/metrics?name=${name}&from=${0 | from / 1000}&to=${0 | to / 1000}`, GET, null, cb);
  }
  getLatestMetric(hostId, name, cb) {
    return this.api(`/hosts/tsdb/metrics?hostId=${hostId}&name=${name}`, GET, null, cb);
  }
  setGraphDefinitions(graphDefs, cb) {
    return this.api(`/graph-defs/create`, POST, graphDefs, cb);
  }

  // service metrics
  postServiceMetrics(serviceName, metrics, cb) {
    metrics.forEach(metric => {
      metric.time = metric.time ? metric.time : 0 | Date.now() / 1000;
    });
    return this.api(`/services/${serviceName}/tsdb`, POST, metrics, cb);
  }
  getServiceMetrics(serviceName, name, from, to, cb) {
    return this.api(`/services/${serviceName}/metrics?name=${name}&from=${0 | from / 1000}&to=${0 | to / 1000}`, GET, null, cb);
  }

  // check monitoring
  postCheckReports(data, cb) {
    return this.api(`/monitoring/checks/report`, POST, data, cb);
  }

  // meta
  getMetadata(hostId, namespace, cb) {
    return this.api(`/hosts/${hostId}/metadata/${namespace}`, GET, null, cb);
  }
  modifyMetadata(hostId, namespace, data, cb) {
    return this.api(`/hosts/${hostId}/metadata/${namespace}`, PUT, data, cb);
  }
  deleteMetadata(hostId, namespace, cb) {
    return this.api(`/hosts/${hostId}/metadata/${namespace}`, DELETE, null, cb);
  }

  // monitors
  createMonitor(data, cb) {
    return this.api(`/monitors`, POST, data, cb);
  }
  getMonitors(cb) {
    return this.api(`/monitors`, GET, null, cb);
  }
  modifyMonitor(monitorId, data, cb) {
    return this.api(`/monitors`, PUT, data, cb);
  }
  deleteMonitor(monitorId, cb) {
    return this.api(`/monitors`, DELETE, null, cb);
  }

  // alert
  getAlert(cb) {
    return this.api(`/alerts`, GET, null, cb);
  }
  closeAlert(alertId, reason, cb) {
    return this.api(`/alerts/${alertId}/close`, POST, reason, cb);
  }

  // dashboards
  createDashboard(dashboard, cb) {
    return this.api(`/dashboards`, POST, dashboard, cb);
  }
  getDashboard(dashboardId, cb) {
    return this.api(`/dashboards/${dashboardId}`, GET, null, cb);
  }
  modifyDashboard(dashboardId, dashboard, cb) {
    return this.api(`/dashboards/${dashboardId}`, PUT, dashboard, cb);
  }
  deleteDashboard(dashboardId, cb) {
    return this.api(`/dashboards/${dashboardId}`, DELETE, cb);
  }
  getDashboards(cb) {
    return this.api(`/dashboards`, GET, null, cb);
  }

  // graph annotations
  createGraphAnnotation(annotation, cb) {
    return this.api(`/graph-annotations`, POST, annotation, cb);
  }
  getGraphAnnotation(service, from, to, cb) {
    return this.api(`/graph-annotations?service=${service}&from=${from}&to=${to}`, GET, null, cb);
  }
  modifyGraphAnnotation(annotationId, annotation, from, to, cb) {
    return this.api(`/graph-annotations`, PUT, annotation, cb);
  }
  deleteGraphAnnotation(annotationId, cb) {
    return this.api(`/graph-annotations/${annotationId}`, GET, null, cb);
  }

  // user
  getUsers(cb) {
    return this.api(`/users`, GET, null, cb);
  }
  deleteUser(userId, cb) {
    return this.api(`/users/${userId}`, GET, null, cb);
  }

  // invitations
  createInvitation(invitation, cb) {
    return this.api(`/invitations`, POST, invitation, cb);
  }

  // organization
  getOrganization(cb) {
    return this.api(`/org`, GET, null, cb);
  }
};

Mackerel.NoAPIKeyError = createError("NoAPIKeyError");

module.exports = Mackerel;