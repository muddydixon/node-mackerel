/* @flow */
const qs = require("querystring");
const request = require("request");
const createError = require("create-error");

const ORIGIN: string = "https://mackerel.io";
const VERSION: string = "v0";
const GET: string = "GET", POST: string = "POST", PUT: string = "PUT", DELETE: string = "DELETE";

type UnionMethods = "GET" | "POST" | "PUT" | "DELETE";
type UnionHostStatus = "standby" | "working" | "maintenance" | "poweroff";
type UnionGraphUnit = "float" | "integer" | "percentage" | "bytes" | "bytes/sec" | "iops";
type UnionCheckStatus = "OK" | "CRITICAL" | "WARNING" | "UNKNOWN";
type UnionOperator = ">" | "<";
type UnionAuthority = "manager" | "collaborator" | "viewer";

type MackerelOption = {
	origin?: string;
	version?: string;
	endpoint?: string;
	proxy?: ?string;
};

type RequestOption = {
  method: UnionMethods;
  url: string;
  proxy?: ?string;
  headers: Object;
  form: ?string;
};

type ResolveArgs = {
  res: Object;
  body: Object;
};

type MetaInfo = {
  "agent-name": string;
  "agent-revision": string;
  "agent-version": string;
  block_device: Object;
  cpu: [Object];
  filesystem: Object;
  kernel: Object;
  memory: Object;
};

type Interface = {
  name: string;
  ipAddress: string;
  macAddress: string;
  ipv4Address: string;
  ipv6Address: string;
};

type HostInfo = {
  name: string;
  meta: MetaInfo;
  interfaces: [Interface];
  ruleFullNames: [string];
  checks: [string];
  displayName: string;
  customIdentifier: string;
};

type MetricInfo = {
  hostId?: string;
  name: string;
  time: ?number;
  value: number;
};

type MetricObject = {
  name: string;
  displayName: string;
  isStacked: boolean;
};

type GraphDef = {
  name: string;
  displayName: string;
  unit: UnionGraphUnit;
  metrics: [MetricObject];
};

type SourceInfo = {
  type: string;
  hostId: string;
};

type ReportInfo = {
  source: SourceInfo;
  name: string;
  status: UnionCheckStatus;
  message: string;
  occurredAt: number;
  notificationInterval?: number;
};

type HostMonitorInfo = {
  type: string;
  name: string;
  memo?: string;
  duration: number;
  metric: string;
  operator: UnionOperator;
  warning: number;
  critical: number;
  notificationInterval?: number;
  scopes?: [string];
  excludeScopes?: [string];
  isMute?: boolean;
};

type ConnectivityMonitorInfo = {
  type: string;
  name: string;
  memo?: string;
  scopes?: [string];
  excludeScopes?: [string];
  isMute?: boolean;
};

type ServiceMonitorInfo = {
  type: string;
  name: string;
  memo?: string;
  service: string;
  duration: number;
  metric: string;
  operator: UnionOperator;
  warning: number;
  critical: number;
  notificationInterval?: number;
  scopes?: [string];
  excludeScopes?: [string];
  isMute?: boolean;
};

type ExternalMonitorInfo = {
  type: string;
  name: string;
  memo?: string;
  url: string;
  method?: string;
  service: string;
  notificationInterval?: number;
  responseTimeWarning?: number;
  responseTimeCritical?: number;
  responseTimeDuration?: number;
  containsString?: string;
  maxCheckAttempts?: number;
  certificationExpirationWarning?: number;
  certificationExpirationCritical?: number;
  skipCertificateVerification?: boolean;
  isMute?: boolean;
  headers?: [Object];
  requestBody?: string;
};

type ExpressionMonitorInfo = {
  type: string;
  name: string;
  memo?: string;
  expression: string;
  operator: UnionOperator;
  warning: number;
  critical: number;
  notificationInterval?: number;
  scopes?: [string];
  excludeScopes?: [string];
  isMute?: boolean;
};

type DashboardInfo = {
  title: string;
  bodyMarkdown:string;
  urlPath: string;
};

type AnnotationInfo = {
  title: string;
  description?: string;
  from: number;
  to: number;
  service: string;
  roles?: [string];
};

type InvitationInfo = {
  email: string;
  authority: UnionAuthority;
};

class Mackerel {
  apikey: string;
  origin: string;
  version: string;
  endpoint: string;
  proxy: ?string;

  constructor(apikey: string, options: MackerelOption = {}): void{
    if (!apikey) throw new Mackerel.NoAPIKeyError();
    this.apikey = apikey;
    this.origin = options.origin || ORIGIN;
    this.version = options.version || VERSION;
    this.endpoint = `${this.origin}/api/${this.version}`;
    this.proxy = options.proxy || undefined;
  };

	request(path: string, method: UnionMethods, data: any): Promise<any> {
		const opt: RequestOption = {
			method,
			url: `${this.endpoint}${path}`,
			headers: {
				"X-Api-Key": this.apikey,
				contentType: "application/json",
				accepts: "application/json"
			},
      form: null
		};
    if(this.proxy) opt.proxy = this.proxy;

		const reqData: string = JSON.stringify(data || {});
    if([GET, DELETE].indexOf(method) > -1){
      opt.url = `${opt.url}?${reqData}`;
    }else if([POST, PUT].indexOf(method) > -1){
      opt.form = reqData;
    }

		return new Promise((resolve: Function, reject: Function)=>{
			return request[method.toLowerCase()](opt, (err: ?Error, res: Object, body: string)=>{
        const jsonBody = JSON.parse(body || "{}");
        if(res.statusCode >= 400){
          return reject(new Error(jsonBody.error || "unknown err"));
        }
        if(err) return reject(err);
        return resolve({res, body});
      });
		});
	};

  api(path: string, method: UnionMethods, data: any, cb: ?Function): Promise<any>{
    return this.request(path, method, data).then(({res, body})=>{
      return cb ? cb(null, res, body) : {res, body};
    }).catch((err)=>{
      if(cb) return cb(err);
      throw err;
    });
  };

  // services
  getServices(cb: Function): Promise<any>{
    return this.api("/services", GET, null, cb);
  };
  getRoles(serviceName: string, cb: ?Function): Promise<any>{
    return this.api(`/services/${serviceName}/roles`, GET, null, cb);
  };
  getTags(serviceName: string, cb: ?Function): Promise<any>{
    return this.api(`/services/${serviceName}/tags`, GET, null, cb);
  };

  // hosts
  addHost(hostInfo: HostInfo, cb: ?Function): Promise<any>{
    return this.api(`/hosts`, POST, hostInfo, cb);
  };
  getHosts(cb: ?Function): Promise<any>{
    return this.api(`/hosts`, GET, null, cb);
  };
  getHost(hostId: string, cb: ?Function): Promise<any>{
    return this.api(`/hosts/${hostId}`, GET, null, cb);
  };
  modifyHost(hostInfo: HostInfo, cb: ?Function): Promise<any>{
    return this.api(`/hosts`, PUT, hostInfo, cb);
  };
  modifyHostStatus(hostId: string, status: UnionHostStatus, cb: ?Function): Promise<any>{
    return this.api(`/hosts/${hostId}/status`, POST, {status}, cb);
  };
  modifyHostRole(hostId: string, roles: [string], cb: ?Function): Promise<any>{
    roles = Array.isArray(roles) ? roles : [roles];
    return this.api(`/hosts/${hostId}/role-fullnames`, PUT, {roleFullnames: roles}, cb);
  };
  retireHost(hostId: string, cb: ?Function): Promise<any>{
    return this.api(`/hosts/${hostId}/retire`, POST, {}, cb);
  };
  getHostMetrics(hostId: string, cb: ?Function): Promise<any>{
    return this.api(`/hosts/${hostId}/metric-names`, GET, null);
  };

  // host metrics
  postMetrics(metrics: [MetricInfo], cb: ?Function): Promise<any>{
    metrics.forEach((metric: MetricInfo): void =>{ metric.time = metric.time ? metric.time : 0|(Date.now() / 1000); });
    return this.api(`/tsdb`, POST, metrics, null);
  };
  getHostMetric(hostId: string, name: string, from: Date, to: Date, cb: ?Function): Promise<any>{
    return this.api(`/hosts/${hostId}/metrics?name=${name}&from=${0|(from / 1000)}&to=${0|(to / 1000)}`, GET, null, cb);
  };
  getLatestMetric(hostId: string, name: string, cb: ?Function): Promise<any>{
    return this.api(`/hosts/tsdb/metrics?hostId=${hostId}&name=${name}`, GET, null, cb);
  };
  setGraphDefinitions(graphDefs: [GraphDef], cb: ?Function): Promise<any>{
    return this.api(`/graph-defs/create`, POST, graphDefs, cb);
  };

  // service metrics
  postServiceMetrics(serviceName: string, metrics: [MetricInfo], cb: ?Function): Promise<any>{
    metrics.forEach((metric: MetricInfo): void =>{ metric.time = metric.time ? metric.time : 0|(Date.now() / 1000); });
    return this.api(`/services/${serviceName}/tsdb`, POST, metrics, cb);
  };
  getServiceMetrics(serviceName: string, name: string, from: Date, to: Date, cb: ?Function): Promise<any>{
    return this.api(`/services/${serviceName}/metrics?name=${name}&from=${0|(from / 1000)}&to=${0|(to / 1000)}`, GET, null, cb);
  };

  // check monitoring
  postCheckReports(data: {reports: [ReportInfo]}, cb: ?Function): Promise<any>{
    return this.api(`/monitoring/checks/report`, POST, data, cb);
  };

  // meta
  getMetadata(hostId: string, namespace: string, cb: ?Function): Promise<any>{
    return this.api(`/hosts/${hostId}/metadata/${namespace}`, GET, null, cb);
  };
  modifyMetadata(hostId: string, namespace: string, data: Object, cb: ?Function): Promise<any>{
    return this.api(`/hosts/${hostId}/metadata/${namespace}`, PUT, data, cb);
  };
  deleteMetadata(hostId: string, namespace: string, cb: ?Function): Promise<any>{
    return this.api(`/hosts/${hostId}/metadata/${namespace}`, DELETE, null, cb);
  };

  // monitors
  createMonitor(data: HostMonitorInfo | ConnectivityMonitorInfo | ServiceMonitorInfo | ExpressionMonitorInfo, cb: ?Function): Promise<any>{
    return this.api(`/monitors`, POST, data, cb);
  };
  getMonitors(cb: ?Function): Promise<any>{
    return this.api(`/monitors`, GET, null, cb);
  };
  modifyMonitor(monitorId: string, data: HostMonitorInfo | ConnectivityMonitorInfo | ServiceMonitorInfo | ExpressionMonitorInfo, cb: ?Function): Promise<any>{
    return this.api(`/monitors`, PUT, data, cb);
  };
  deleteMonitor(monitorId: string, cb: ?Function): Promise<any>{
    return this.api(`/monitors`, DELETE, null, cb);
  };

  // alert
  getAlert(cb: ?Function): Promise<any>{
    return this.api(`/alerts`, GET, null, cb);
  };
  closeAlert(alertId: string, reason: {reason: string}, cb: ?Function): Promise<any>{
    return this.api(`/alerts/${alertId}/close`, POST, reason, cb);
  };

  // dashboards
  createDashboard(dashboard: DashboardInfo, cb: ?Function): Promise<any>{
    return this.api(`/dashboards`, POST, dashboard, cb);
  };
  getDashboard(dashboardId: string, cb: ?Function): Promise<any>{
    return this.api(`/dashboards/${dashboardId}`, GET, null, cb);
  };
  modifyDashboard(dashboardId: string, dashboard: DashboardInfo, cb: ?Function): Promise<any>{
    return this.api(`/dashboards/${dashboardId}`, PUT, dashboard, cb);
  };
  deleteDashboard(dashboardId: string, cb: ?Function): Promise<any>{
    return this.api(`/dashboards/${dashboardId}`, DELETE, cb);
  };
  getDashboards(cb: ?Function): Promise<any>{
    return this.api(`/dashboards`, GET, null, cb);
  };

  // graph annotations
  createGraphAnnotation(annotation: AnnotationInfo, cb: ?Function): Promise<any>{
    return this.api(`/graph-annotations`, POST, annotation, cb);
  };
  getGraphAnnotation(service: string, from: number, to: number, cb: ?Function): Promise<any>{
    return this.api(`/graph-annotations?service=${service}&from=${from}&to=${to}`, GET, null, cb);
  };
  modifyGraphAnnotation(annotationId: string, annotation: AnnotationInfo, from: number, to: number, cb: ?Function): Promise<any>{
    return this.api(`/graph-annotations`, PUT, annotation, cb);
  };
  deleteGraphAnnotation(annotationId: string, cb: ?Function): Promise<any>{
    return this.api(`/graph-annotations/${annotationId}`, GET, null, cb);
  };

  // user
  getUsers(cb: ?Function): Promise<any>{
    return this.api(`/users`, GET, null, cb);
  };
  deleteUser(userId: string, cb: ?Function): Promise<any>{
    return this.api(`/users/${userId}`, GET, null, cb);
  };

  // invitations
  createInvitation(invitation: InvitationInfo, cb: ?Function): Promise<any>{
    return this.api(`/invitations`, POST, invitation, cb);
  };

  // organization
  getOrganization(cb: ?Function): Promise<any>{
    return this.api(`/org`, GET, null, cb);
  };

};

Mackerel.NoAPIKeyError = createError("NoAPIKeyError");

module.exports = Mackerel;
