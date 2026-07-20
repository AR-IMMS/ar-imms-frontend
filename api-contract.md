# Asset Service — API Contract

> Backend implementation: `backend/apps/control-plane/asset-service/`
> Source: implementation (NestJS controllers, DTOs, guards, serializers, use cases).

---

## Service Overview

| Property            | Value                                                                                                                                          |
| ------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| **Purpose**         | Manages rack/node/marker asset topology (CRUD + lifecycle) and exposes contextual lookup APIs for dashboards, AR integrations, and neighbours. |
| **Base URL**        | `http://localhost:4002/api/v1` (port configurable via `PORT`, default `4002`)                                                                  |
| **Auth method**     | JWT bearer token (issued by identity-service). Token validated with `JWT_ACCESS_SECRET` / `ACCESS_TOKEN_SECRET`.                               |
| **Response format** | `application/json` — wrapped in a uniform envelope (see below).                                                                                |
| **Error format**    | RFC 7807-style `application/json` (see Error Codes).                                                                                           |
| **Swagger UI**      | `GET /api/v1/docs` (enabled unless `SWAGGER_ENABLED=false`).                                                                                   |

### Request IDs

Every request is assigned `x-request-id` (UUID) and `x-correlation-id` (defaults to request id). Both are echoed back in response headers and inside `meta`.

### Global prefix

All routes below are relative to `/api/v1`. Example: `GET /api/v1/health`.

### Global validation pipe

- `whitelist: true` — unknown properties are stripped.
- `forbidNonWhitelisted: true` — if a non-whitelisted property is present, the request fails validation.
- `transform: true` — DTO primitives are coerced (e.g. query string `"123"` → number if `@IsInt()`).

### Global exception filter

`ProblemDetailsExceptionFilter` catches all thrown exceptions and emits the error envelope described below.

---

## Response Envelope

### Success

```jsonc
{
  "data": {
    /* payload */
  },
  "meta": {
    "requestId": "uuid",
    "correlationId": "uuid",
    "version": "v1",
    "timestamp": "2026-06-27T10:00:00.000Z",
  },
}
```

### Error

```jsonc
{
  "error": {
    "code": "ASSET_RACK_NOT_FOUND",
    "message": "Not Found",
    "details": {
      "status": 404,
      "type": "about:blank",
      "instance": "/api/v1/racks/abc/topology",
      "reason": "Rack abc was not found.",
      "detail": "Rack abc was not found.",
    },
  },
  "meta": {
    /* same shape as success */
  },
}
```

When validation fails, `details.invalidParams` is an array of `{ name, reason }` items (one per constraint, dotted path for nested fields).

---

## Authentication

All endpoints except `GET /health` require a valid JWT bearer token:

```
Authorization: Bearer <token>
```

The token payload **must** match `CurrentAuthContextDto`:

```ts
interface CurrentAuthContextDto {
  userId: string;
  username: string;
  sessionId: string;
  roles: string[];
  permissions: PermissionCode[];
}
```

- Missing/invalid/expired token → `401 UNAUTHENTICATED`.
- Valid token but missing permissions → `403 PERMISSION_DENIED`.

---

## Authorization

Fine-grained permission codes (declared in `PERMISSION_CODES`). Each protected endpoint declares the required permission via `@RequirePermissions(...)`. **All** of the listed permissions must be present in the caller's token (`every` semantics).

| Permission code             | Required by endpoints                                                                                                                                                                                                                                             |
| --------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `dashboard.read`            | `GET /topology/tree`, `GET /assets/search`                                                                                                                                                                                                                        |
| `assets.health.read`        | `GET /nodes/:nodeId/context`, `GET /assets/by-code/:code`                                                                                                                                                                                                         |
| `ar.assets.identify`        | `GET /markers/resolve/:markerCode`                                                                                                                                                                                                                                |
| `topology.structure.manage` | `POST/PATCH /admin/topology/racks/*`, `POST /admin/topology/racks/:rackId/{confirm-ready,activate,drain,retire}`                                                                                                                                                  |
| `topology.nodes.manage`     | `POST /admin/topology/nodes/normalize`, `GET /admin/topology/discovered-nodes`, `PATCH /admin/topology/nodes/:nodeId`, `POST /admin/topology/nodes/{:nodeId,discovered-nodes/:agentId}/assign-rack`, `POST /admin/topology/nodes/:nodeId/{activate,drain,retire}` |
| `markers.manage`            | All `/admin/markers*` routes                                                                                                                                                                                                                                      |

---

## API Endpoints

### Health

#### `GET /health`

Public. No auth.

**Success response** `200 OK`

```jsonc
{
  "data": {
    "service": "asset-service",
    "status": "ok",
  },
}
```

---

### Asset Queries

All routes in this section require JWT + the permissions listed per route.

#### `GET /topology/tree`

Returns the full topology tree: every rack with its nodes and the latest runtime snapshot per node.

**Permissions**: `dashboard.read`

**Success response** `200 OK`

```ts
type Response = RackTopologyResult[];
```

```jsonc
{
  "data": [
    {
      "rack": {
        /* RackEntity */
      },
      "nodes": [
        /* NodeEntity[] */
      ],
      "nodeRuntimeSnapshots": [
        /* NodeRuntimeSnapshotEntity[] */
      ],
    },
  ],
}
```

---

#### `GET /racks/:rackId/topology`

Returns topology for a single rack.

**Permissions**: `dashboard.read`

**Path params**:

| Name     | Type   | Required | Notes                    |
| -------- | ------ | -------- | ------------------------ |
| `rackId` | string | yes      | Rack id (Mongo ObjectId) |

**Success response** `200 OK` — `RackTopologyResult`

**Error responses**:

| HTTP | Code                   | When                   |
| ---- | ---------------------- | ---------------------- |
| 404  | `ASSET_RACK_NOT_FOUND` | Rack id does not exist |

---

#### `GET /nodes/:nodeId/context`

Returns node context (node, parent rack, latest runtime snapshot, markers, topology path). Workload truth is **not** included — see `externalContext.workloadSource`.

**Permissions**: `assets.health.read`

**Path params**:

| Name     | Type   | Required | Notes                                                                              |
| -------- | ------ | -------- | ---------------------------------------------------------------------------------- |
| `nodeId` | string | yes      | Node id (Mongo ObjectId) or `nodeCode` (looked up by code if not a valid ObjectId) |

**Success response** `200 OK` — `NodeContextResult`

```ts
interface NodeContextResult {
  node: NodeEntity;
  rack?: RackEntity;
  runtimeSnapshot?: NodeRuntimeSnapshotEntity;
  markers: MarkerEntity[];
  topologyPath: { rackId?: string; rackCode?: string };
  externalContext: { workloadSource: "monitoring-service-or-bff" };
}
```

**Error responses**:

| HTTP | Code                   | When      |
| ---- | ---------------------- | --------- |
| 404  | `ASSET_NODE_NOT_FOUND` | Not found |

---

#### `GET /assets/by-code/:code`

Finds an asset summary by code across rack, node, marker (in that priority order).

**Permissions**: `assets.health.read`

**Path params**:

| Name   | Type   | Required | Notes                 |
| ------ | ------ | -------- | --------------------- |
| `code` | string | yes      | Rack/node/marker code |

**Success response** `200 OK` — `AssetSummary`

```ts
interface AssetSummary {
  id: string;
  type: AssetType; // 'rack' | 'node' | 'marker'
  code: string;
  name: string;
  lifecycleState?: string;
}
```

**Error responses**:

| HTTP | Code        | When                    |
| ---- | ----------- | ----------------------- |
| 404  | `NOT_FOUND` | No asset with that code |

---

#### `GET /markers/resolve/:markerCode`

Resolves a marker to its target asset plus surrounding topology. Used by AR flows to identify what a marker is attached to.

**Permissions**: `ar.assets.identify`

**Path params**:

| Name         | Type   | Required | Notes       |
| ------------ | ------ | -------- | ----------- |
| `markerCode` | string | yes      | Marker code |

**Success response** `200 OK` — `MarkerResolutionResult`

```ts
interface MarkerResolutionResult {
  marker: MarkerEntity;
  target: AssetSummary;
  rack?: RackEntity;
  node?: NodeEntity;
  runtimeSnapshot?: NodeRuntimeSnapshotEntity;
  topologyPath: { rackId?: string; rackCode?: string };
  externalContext: { workloadSource: "monitoring-service-or-bff" };
}
```

**Error responses**:

| HTTP | Code                          | When                              |
| ---- | ----------------------------- | --------------------------------- |
| 404  | `ASSET_MARKER_NOT_FOUND`      | Marker code not found             |
| 404  | `ASSET_MARKER_TARGET_INVALID` | Marker is not mapped to any asset |
| 404  | `ASSET_RACK_NOT_FOUND`        | Marker target rack does not exist |
| 404  | `ASSET_NODE_NOT_FOUND`        | Marker target node does not exist |

---

#### `GET /assets/search`

Full-list search across racks, nodes, markers. Filter by `type` and/or substring `q` (case-insensitive match on `code` or `name`).

**Permissions**: `dashboard.read`

**Query params**:

| Name   | Type        | Required | Notes                           |
| ------ | ----------- | -------- | ------------------------------- |
| `q`    | string      | no       | Substring match on code or name |
| `type` | `AssetType` | no       | One of `rack`, `node`, `marker` |

**Success response** `200 OK` — `AssetSummary[]`

---

### Admin Topology

All routes require JWT + `topology.structure.manage` or `topology.nodes.manage` as noted.

#### `POST /admin/topology/racks`

Create a new rack in `CREATED` state with `capacityState = AVAILABLE`.

**Permissions**: `topology.structure.manage`

**Request body** (`CreateRackRequestDto`, JSON):

| Field           | Type    | Required | Validation            |
| --------------- | ------- | -------- | --------------------- |
| `rackCode`      | string  | yes      | non-empty             |
| `displayName`   | string  | yes      | non-empty             |
| `siteCode`      | string  | no       |                       |
| `roomCode`      | string  | no       |                       |
| `zoneCode`      | string  | no       |                       |
| `rowCode`       | string  | no       |                       |
| `positionCode`  | string  | no       |                       |
| `capacityLimit` | integer | no       | `>= 1`                |
| `vendor`        | string  | no       |                       |
| `notes`         | string  | no       |                       |
| `metadata`      | object  | no       | arbitrary JSON object |

**Success response** `201 Created` — `RackEntity`

**Error responses**:

| HTTP | Code                  | When                      |
| ---- | --------------------- | ------------------------- |
| 400  | `ASSET_CODE_CONFLICT` | `rackCode` already in use |

---

#### `PATCH /admin/topology/racks/:rackId`

Update rack business fields.

**Permissions**: `topology.structure.manage`

**Path params**:

| Name     | Type   | Required |
| -------- | ------ | -------- |
| `rackId` | string | yes      |

**Request body** (`UpdateRackRequestDto`, JSON, all optional):

| Field           | Type                | Required | Validation                              |
| --------------- | ------------------- | -------- | --------------------------------------- |
| `rackCode`      | string              | no       | non-empty if present                    |
| `displayName`   | string              | no       | non-empty if present                    |
| `capacityState` | `RackCapacityState` | no       | One of `AVAILABLE`, `EXPANDING`, `FULL` |
| `siteCode`      | string              | no       |                                         |
| `roomCode`      | string              | no       |                                         |
| `zoneCode`      | string              | no       |                                         |
| `rowCode`       | string              | no       |                                         |
| `positionCode`  | string              | no       |                                         |
| `capacityLimit` | integer             | no       | `>= 1`                                  |
| `vendor`        | string              | no       |                                         |
| `notes`         | string              | no       |                                         |
| `metadata`      | object              | no       |                                         |

**Success response** `200 OK` — updated `RackEntity`

**Error responses**:

| HTTP | Code                   | When                                  |
| ---- | ---------------------- | ------------------------------------- |
| 404  | `ASSET_RACK_NOT_FOUND` | Rack not found                        |
| 400  | `ASSET_CODE_CONFLICT`  | New `rackCode` collides with existing |

---

#### `POST /admin/topology/racks/:rackId/confirm-ready`

Transition rack `CREATED → READY`.

**Permissions**: `topology.structure.manage`

**Success response** `200 OK` — updated `RackEntity`

**Error responses**:

| HTTP | Code                   | When                           |
| ---- | ---------------------- | ------------------------------ |
| 404  | `ASSET_RACK_NOT_FOUND` | Rack not found                 |
| 400  | `INVALID_ARGUMENT`     | Rack is not in `CREATED` state |

---

#### `POST /admin/topology/racks/:rackId/activate`

Transition rack `READY|ACTIVE → ACTIVE`.

**Permissions**: `topology.structure.manage`

**Success response** `200 OK` — updated `RackEntity`

**Error responses**:

| HTTP | Code                   | When                               |
| ---- | ---------------------- | ---------------------------------- |
| 404  | `ASSET_RACK_NOT_FOUND` | Rack not found                     |
| 400  | `INVALID_ARGUMENT`     | Rack is not in `READY` or `ACTIVE` |

---

#### `POST /admin/topology/racks/:rackId/drain`

Transition rack `ACTIVE → DRAINING`.

**Permissions**: `topology.structure.manage`

**Success response** `200 OK` — updated `RackEntity`

**Error responses**:

| HTTP | Code                   | When                 |
| ---- | ---------------------- | -------------------- |
| 404  | `ASSET_RACK_NOT_FOUND` | Rack not found       |
| 400  | `INVALID_ARGUMENT`     | Rack is not `ACTIVE` |

---

#### `POST /admin/topology/racks/:rackId/retire`

Transition rack to `RETIRED`. **Fails if any node is still assigned to the rack.**

**Permissions**: `topology.structure.manage`

**Success response** `200 OK` — updated `RackEntity`

**Error responses**:

| HTTP | Code                   | When                                      |
| ---- | ---------------------- | ----------------------------------------- |
| 404  | `ASSET_RACK_NOT_FOUND` | Rack not found                            |
| 400  | `ASSET_PARENT_INVALID` | Rack still has at least one assigned node |

---

#### `POST /admin/topology/nodes/normalize`

Normalize a discovered node into an asset record. If a node with the same `nodeCode` already exists, it is updated (and its lifecycle is set to `READY` unless currently `RETIRED`); otherwise a new node is created in `READY` / `UNASSIGNED`.

**Permissions**: `topology.nodes.manage`

**Request body** (`NormalizeNodeRequestDto`, JSON):

| Field          | Type   | Required | Validation |
| -------------- | ------ | -------- | ---------- |
| `nodeCode`     | string | yes      | non-empty  |
| `displayName`  | string | yes      | non-empty  |
| `source`       | string | yes      | non-empty  |
| `hostname`     | string | no       |            |
| `nodeType`     | string | no       |            |
| `serialNumber` | string | no       |            |
| `vendor`       | string | no       |            |
| `model`        | string | no       |            |
| `managementIp` | string | no       |            |
| `notes`        | string | no       |            |
| `metadata`     | object | no       |            |

**Success response** `200 OK` (update) or `201 Created` (new) — `NodeEntity`

**Error responses**:

| HTTP | Code       | When                         |
| ---- | ---------- | ---------------------------- |
| 409  | `CONFLICT` | Duplicate-key on update path |

---

#### `GET /admin/topology/discovered-nodes`

List discovered nodes stored in shared Redis state (source of truth for discovery, separate from asset records).

**Permissions**: `topology.nodes.manage`

**Success response** `200 OK` — `DiscoveredNodeEntity[]`

```ts
interface DiscoveredNodeEntity {
  agentId: string;
  hostname: string;
  deviceType: string;
  source?: string;
  lifecycleState: NodeLifecycleState;
  assignmentState: NodeAssignmentState;
  logicalRackId?: string;
  siteCode?: string;
  hardware: DiscoveredNodeHardwareEntity;
  createdAt: string;
  updatedAt: string;
}
```

---

#### `PATCH /admin/topology/nodes/:nodeId`

Update node business fields. Validates `positionCode` against the parent rack capacity and uniqueness within the rack.

**Permissions**: `topology.nodes.manage`

**Path params**:

| Name     | Type   | Required | Notes                                |
| -------- | ------ | -------- | ------------------------------------ |
| `nodeId` | string | yes      | Node id (ObjectId) **or** `nodeCode` |

**Request body** (`UpdateNodeRequestDto`, JSON, all optional):

| Field          | Type   | Required | Validation                            |
| -------------- | ------ | -------- | ------------------------------------- |
| `nodeCode`     | string | no       | non-empty if present; must be unique  |
| `displayName`  | string | no       | non-empty if present                  |
| `source`       | string | no       |                                       |
| `hostname`     | string | no       |                                       |
| `nodeType`     | string | no       |                                       |
| `serialNumber` | string | no       |                                       |
| `vendor`       | string | no       |                                       |
| `model`        | string | no       |                                       |
| `managementIp` | string | no       |                                       |
| `positionCode` | string | no       | Must be `U<int>` within rack capacity |
| `notes`        | string | no       |                                       |
| `metadata`     | object | no       |                                       |

**Success response** `200 OK` — updated `NodeEntity`

**Error responses**:

| HTTP | Code                   | When                                                    |
| ---- | ---------------------- | ------------------------------------------------------- |
| 404  | `ASSET_NODE_NOT_FOUND` | Node not found                                          |
| 404  | `ASSET_RACK_NOT_FOUND` | Node's parent rack not found (when validating position) |
| 400  | `ASSET_CODE_CONFLICT`  | New `nodeCode` collides with existing                   |
| 400  | `INVALID_ARGUMENT`     | `positionCode` exceeds rack capacity (`U>N`)            |
| 409  | `CONFLICT`             | Another node already occupies the same rack + position  |

---

#### `POST /admin/topology/nodes/:nodeId/assign-rack`

Assign or move a node into a rack at a specific position.

**Permissions**: `topology.nodes.manage`

**Path params**:

| Name     | Type   | Required | Notes                                |
| -------- | ------ | -------- | ------------------------------------ |
| `nodeId` | string | yes      | Node id (ObjectId) **or** `nodeCode` |

**Request body** (`AssignNodeToRackRequestDto`, JSON):

| Field           | Type    | Required | Validation                               |
| --------------- | ------- | -------- | ---------------------------------------- |
| `rackId`        | string  | yes      | non-empty                                |
| `positionCode`  | string  | yes      | non-empty; `U<int>` within rack capacity |
| `allowDraining` | boolean | no       | defaults `false`                         |

**Success response** `200 OK` — updated `NodeEntity`

**Error responses**:

| HTTP | Code                          | When                                                                                      |
| ---- | ----------------------------- | ----------------------------------------------------------------------------------------- |
| 404  | `ASSET_NODE_NOT_FOUND`        | Node not found                                                                            |
| 404  | `ASSET_RACK_NOT_FOUND`        | Rack not found                                                                            |
| 400  | `INVALID_ARGUMENT`            | Node is retired, rack is retired, position exceeds capacity, or node already in that rack |
| 400  | `ASSET_NODE_ALREADY_ASSIGNED` | Node already assigned to that exact rack                                                  |
| 409  | `CONFLICT`                    | Another node already occupies the same rack + position                                    |

> Note: assigning to a `DRAINING` rack requires `allowDraining=true`.

---

#### `POST /admin/topology/discovered-nodes/:agentId/assign-rack`

Compound operation: normalize a discovered Redis-backed node, assign it to a rack, and activate it. Updates the discovered node record in Redis to `ACTIVE` / `ASSIGNED` with `logicalRackId`.

**Permissions**: `topology.nodes.manage`

**Path params**:

| Name      | Type   | Required |
| --------- | ------ | -------- |
| `agentId` | string | yes      |

**Request body**: `AssignNodeToRackRequestDto` (same as above).

**Success response** `200 OK`

```jsonc
{
  "data": {
    "node": {
      /* NodeEntity */
    },
    "discoveredNode": {
      /* DiscoveredNodeEntity */
    },
  },
}
```

**Error responses**: same as `assign-rack` plus `ASSET_NODE_NOT_FOUND` when the discovered node is missing.

---

#### `POST /admin/topology/nodes/:nodeId/activate`

Transition node `READY|DISCOVERED → ACTIVE`. Node must already be assigned to a rack.

**Permissions**: `topology.nodes.manage`

**Success response** `200 OK` — updated `NodeEntity`

**Error responses**:

| HTTP | Code                   | When                           |
| ---- | ---------------------- | ------------------------------ |
| 404  | `ASSET_NODE_NOT_FOUND` | Node not found                 |
| 400  | `INVALID_ARGUMENT`     | Node is not assigned to a rack |

---

#### `POST /admin/topology/nodes/:nodeId/drain`

Transition node `ACTIVE → DRAINING`.

**Permissions**: `topology.nodes.manage`

**Success response** `200 OK` — updated `NodeEntity`

**Error responses**:

| HTTP | Code                   | When                 |
| ---- | ---------------------- | -------------------- |
| 404  | `ASSET_NODE_NOT_FOUND` | Node not found       |
| 400  | `INVALID_ARGUMENT`     | Node is not `ACTIVE` |

---

#### `POST /admin/topology/nodes/:nodeId/retire`

Transition node to `RETIRED` and release its rack assignment (`rackId → undefined`, `assignmentState → UNASSIGNED`).

**Permissions**: `topology.nodes.manage`

**Success response** `200 OK` — updated `NodeEntity`

**Error responses**:

| HTTP | Code                   | When           |
| ---- | ---------------------- | -------------- |
| 404  | `ASSET_NODE_NOT_FOUND` | Node not found |

---

### Admin Markers

All routes require JWT + `markers.manage`.

#### `POST /admin/markers`

Create a marker in `DRAFT` state. If `targetType` + `targetId` are provided, the target is validated up-front.

**Request body** (`CreateMarkerRequestDto`, JSON):

| Field                  | Type               | Required | Validation                    |
| ---------------------- | ------------------ | -------- | ----------------------------- |
| `markerCode`           | string             | yes      | non-empty; must be unique     |
| `displayLabel`         | string             | no       |                               |
| `targetType`           | `MarkerTargetType` | no       | `rack` or `node`              |
| `targetId`             | string             | no       |                               |
| `imageTargetId`        | string             | no       |                               |
| `worldTrackingEnabled` | boolean            | no       | defaults `true` on the server |
| `notes`                | string             | no       |                               |
| `metadata`             | object             | no       |                               |

**Success response** `201 Created` — `MarkerEntity`

**Error responses**:

| HTTP | Code                          | When                                  |
| ---- | ----------------------------- | ------------------------------------- |
| 400  | `ASSET_CODE_CONFLICT`         | `markerCode` already in use           |
| 404  | `ASSET_RACK_NOT_FOUND`        | Provided target rack does not exist   |
| 404  | `ASSET_NODE_NOT_FOUND`        | Provided target node does not exist   |
| 404  | `ASSET_MARKER_TARGET_INVALID` | Provided target is unmapped / unknown |

---

#### `PATCH /admin/markers/:markerId`

Update editable marker fields. Renaming `markerCode` validates uniqueness.

**Path params**:

| Name       | Type   | Required |
| ---------- | ------ | -------- |
| `markerId` | string | yes      |

**Request body** (`UpdateMarkerRequestDto`, JSON, all optional):

| Field                  | Type    | Required | Validation                   |
| ---------------------- | ------- | -------- | ---------------------------- |
| `markerCode`           | string  | no       | non-empty if present; unique |
| `displayLabel`         | string  | no       |                              |
| `imageTargetId`        | string  | no       |                              |
| `worldTrackingEnabled` | boolean | no       |                              |
| `notes`                | string  | no       |                              |
| `metadata`             | object  | no       |                              |

**Success response** `200 OK` — updated `MarkerEntity`

**Error responses**:

| HTTP | Code                     | When                      |
| ---- | ------------------------ | ------------------------- |
| 404  | `ASSET_MARKER_NOT_FOUND` | Marker not found          |
| 400  | `ASSET_CODE_CONFLICT`    | New `markerCode` collides |

---

#### `POST /admin/markers/:markerId/generate`

Transition `DRAFT → GENERATED`.

**Success response** `200 OK` — updated `MarkerEntity`

**Error responses**:

| HTTP | Code                     | When                  |
| ---- | ------------------------ | --------------------- |
| 404  | `ASSET_MARKER_NOT_FOUND` | Marker not found      |
| 400  | `INVALID_ARGUMENT`       | Marker not in `DRAFT` |

---

#### `POST /admin/markers/:markerId/print`

Transition `GENERATED → PRINTED`.

**Error responses**:

| HTTP | Code                     | When                      |
| ---- | ------------------------ | ------------------------- |
| 404  | `ASSET_MARKER_NOT_FOUND` | Marker not found          |
| 400  | `INVALID_ARGUMENT`       | Marker not in `GENERATED` |

---

#### `POST /admin/markers/:markerId/mount`

Transition `PRINTED → MOUNTED`. Sets `isVisibleInAr = true`.

**Error responses**:

| HTTP | Code                     | When                    |
| ---- | ------------------------ | ----------------------- |
| 404  | `ASSET_MARKER_NOT_FOUND` | Marker not found        |
| 400  | `INVALID_ARGUMENT`       | Marker not in `PRINTED` |

---

#### `POST /admin/markers/:markerId/validate`

Transition `MOUNTED|REMAPPED → VALIDATED`. Sets `bindingStatus = VALIDATED` and `lastValidatedAt = now`.

**Error responses**:

| HTTP | Code                     | When                                  |
| ---- | ------------------------ | ------------------------------------- |
| 404  | `ASSET_MARKER_NOT_FOUND` | Marker not found                      |
| 400  | `INVALID_ARGUMENT`       | Marker not in `MOUNTED` or `REMAPPED` |

---

#### `POST /admin/markers/:markerId/activate`

Transition `VALIDATED → ACTIVE`. Sets `isActive = true`, `bindingStatus = ACTIVE`, `isVisibleInAr = true`.

**Error responses**:

| HTTP | Code                     | When                      |
| ---- | ------------------------ | ------------------------- |
| 404  | `ASSET_MARKER_NOT_FOUND` | Marker not found          |
| 400  | `INVALID_ARGUMENT`       | Marker not in `VALIDATED` |

---

#### `POST /admin/markers/:markerId/remap`

Re-target a marker. Validates the new target. Resets `isActive = false`, `lifecycleState = REMAPPED`, `bindingStatus = REMAPPED_PENDING_VALIDATION`. Refuses retired nodes.

**Request body** (`RemapMarkerTargetRequestDto`, JSON):

| Field        | Type               | Required | Validation       |
| ------------ | ------------------ | -------- | ---------------- |
| `targetType` | `MarkerTargetType` | yes      | `rack` or `node` |
| `targetId`   | string             | yes      | non-empty        |

**Success response** `200 OK` — updated `MarkerEntity`

**Error responses**:

| HTTP | Code                     | When                   |
| ---- | ------------------------ | ---------------------- |
| 404  | `ASSET_MARKER_NOT_FOUND` | Marker not found       |
| 404  | `ASSET_RACK_NOT_FOUND`   | Target rack not found  |
| 404  | `ASSET_NODE_NOT_FOUND`   | Target node not found  |
| 400  | `INVALID_ARGUMENT`       | Target node is retired |

---

#### `POST /admin/markers/:markerId/retire`

Transition marker to `RETIRED`. Sets `isActive = false`, `isVisibleInAr = false`, `bindingStatus = RETIRED`.

**Success response** `200 OK` — updated `MarkerEntity`

**Error responses**:

| HTTP | Code                     | When             |
| ---- | ------------------------ | ---------------- |
| 404  | `ASSET_MARKER_NOT_FOUND` | Marker not found |

---

### Internal / Compatibility

#### `POST /internal/inventory/sync`

**Deprecated.** Always returns `200 OK` with a compatibility message. Asset inventory sync is no longer owned by asset-service.

```jsonc
{
  "data": {
    "deprecated": true,
    "message": "Inventory sync no longer mutates asset truth in asset-service. Use monitoring or workload ownership flows instead.",
  },
}
```

---

## Shared Models

### `RackEntity`

```ts
interface RackEntity {
  id: string;
  rackCode: string;
  displayName: string;
  lifecycleState: RackLifecycleState;
  capacityState: RackCapacityState;
  siteCode?: string;
  roomCode?: string;
  zoneCode?: string;
  rowCode?: string;
  positionCode?: string;
  capacityLimit?: number;
  notes?: string;
  vendor?: string;
  metadata: Record<string, unknown>;
}
```

### `NodeEntity`

```ts
interface NodeEntity {
  id: string;
  nodeCode: string;
  displayName: string;
  hostname?: string;
  rackId?: string;
  positionCode?: string;
  nodeType?: string;
  source: string;
  lifecycleState: NodeLifecycleState;
  assignmentState: NodeAssignmentState;
  serialNumber?: string;
  vendor?: string;
  model?: string;
  managementIp?: string;
  notes?: string;
  metadata: Record<string, unknown>;
}
```

### `MarkerEntity`

```ts
interface MarkerEntity {
  id: string;
  markerCode: string;
  displayLabel?: string;
  lifecycleState: MarkerLifecycleState;
  targetType?: MarkerTargetType;
  targetId?: string;
  bindingStatus: string;
  isActive: boolean;
  isVisibleInAr: boolean;
  imageTargetId?: string;
  worldTrackingEnabled: boolean;
  lastValidatedAt?: string;
  notes?: string;
  metadata: Record<string, unknown>;
}
```

### `NodeRuntimeSnapshotEntity`

```ts
interface NodeRuntimeSnapshotEntity {
  id: string;
  nodeId: string;
  healthState: NodeHealthState;
  heartbeatAt?: string;
  metricsAt?: string;
  cpuUsagePct?: number;
  memoryUsagePct?: number;
  networkRxKbps?: number;
  networkTxKbps?: number;
  activeAlertCount?: number;
  source: string;
  metadata: Record<string, unknown>;
}
```

### `DiscoveredNodeEntity`

```ts
interface DiscoveredNodeHardwareEntity {
  primaryIpv4?: string;
  macAddress?: string;
  hardwareSerial?: string;
  vendor?: string;
  model?: string;
  osProduct?: string;
  logicalCpuCount?: number;
  cpuArchitecture?: string;
}

interface DiscoveredNodeEntity {
  agentId: string;
  hostname: string;
  deviceType: string;
  source?: string;
  lifecycleState: NodeLifecycleState;
  assignmentState: NodeAssignmentState;
  logicalRackId?: string;
  siteCode?: string;
  hardware: DiscoveredNodeHardwareEntity;
  createdAt: string;
  updatedAt: string;
}
```

### `AssetSummary`

```ts
interface AssetSummary {
  id: string;
  type: AssetType;
  code: string;
  name: string;
  lifecycleState?: string;
}
```

### `RackTopologyResult`

```ts
interface RackTopologyResult {
  rack: RackEntity;
  nodes: NodeEntity[];
  nodeRuntimeSnapshots: NodeRuntimeSnapshotEntity[];
}
```

### `NodeContextResult`

```ts
interface NodeContextResult {
  node: NodeEntity;
  rack?: RackEntity;
  runtimeSnapshot?: NodeRuntimeSnapshotEntity;
  markers: MarkerEntity[];
  topologyPath: { rackId?: string; rackCode?: string };
  externalContext: { workloadSource: "monitoring-service-or-bff" };
}
```

### `MarkerResolutionResult`

```ts
interface MarkerResolutionResult {
  marker: MarkerEntity;
  target: AssetSummary;
  rack?: RackEntity;
  node?: NodeEntity;
  runtimeSnapshot?: NodeRuntimeSnapshotEntity;
  topologyPath: { rackId?: string; rackCode?: string };
  externalContext: { workloadSource: "monitoring-service-or-bff" };
}
```

### `CurrentAuthContextDto` (JWT payload)

```ts
interface CurrentAuthContextDto {
  userId: string;
  username: string;
  sessionId: string;
  roles: string[];
  permissions: PermissionCode[];
}
```

---

## Enums

### `AssetType`

| Value    | Notes |
| -------- | ----- |
| `rack`   |       |
| `node`   |       |
| `marker` |       |

### `MarkerTargetType`

| Value  | Notes |
| ------ | ----- |
| `rack` |       |
| `node` |       |

### `RackLifecycleState`

| Value      | Notes                             |
| ---------- | --------------------------------- |
| `CREATED`  | Initial state after `POST /racks` |
| `READY`    | After `confirm-ready`             |
| `ACTIVE`   | After `activate`                  |
| `DRAINING` | After `drain`                     |
| `RETIRED`  | After `retire`                    |

### `RackCapacityState`

| Value       | Notes   |
| ----------- | ------- |
| `AVAILABLE` | Default |
| `EXPANDING` |         |
| `FULL`      |         |

### `NodeLifecycleState`

| Value        | Notes                             |
| ------------ | --------------------------------- |
| `DISCOVERED` | Initial state of discovered nodes |
| `READY`      | After normalize / confirm         |
| `ACTIVE`     | After `activate`                  |
| `DRAINING`   | After `drain`                     |
| `RETIRED`    | After `retire`                    |

### `NodeAssignmentState`

| Value        | Notes                           |
| ------------ | ------------------------------- |
| `UNASSIGNED` |                                 |
| `ASSIGNED`   | First assignment to a rack      |
| `MOVED`      | Re-assigned to a different rack |

### `MarkerLifecycleState`

| Value       | Notes            |
| ----------- | ---------------- |
| `DRAFT`     | After `create`   |
| `GENERATED` | After `generate` |
| `PRINTED`   | After `print`    |
| `MOUNTED`   | After `mount`    |
| `VALIDATED` | After `validate` |
| `ACTIVE`    | After `activate` |
| `REMAPPED`  | After `remap`    |
| `RETIRED`   | After `retire`   |

### `NodeHealthState`

| Value      | Notes |
| ---------- | ----- |
| `ONLINE`   |       |
| `DEGRADED` |       |
| `OFFLINE`  |       |
| `UNKNOWN`  |       |

---

## Error Codes

All errors use the `error.code` value below. HTTP status is in `error.details.status`.

| Code                                       | HTTP | Meaning                                                              |
| ------------------------------------------ | ---- | -------------------------------------------------------------------- |
| `SYS_VALIDATION_ERROR`                     | 400  | Request failed class-validator rules (see `details.invalidParams`)   |
| `UNAUTHENTICATED`                          | 401  | Missing/invalid/expired JWT                                          |
| `PERMISSION_DENIED`                        | 403  | Authenticated but missing required permission(s)                     |
| `CONFLICT`                                 | 409  | State conflict / duplicate key                                       |
| `NOT_FOUND`                                | 404  | Generic not-found                                                    |
| `INVALID_ARGUMENT`                         | 400  | Business-rule violation (e.g. wrong lifecycle state)                 |
| `INTERNAL`                                 | 500  | Unexpected server error                                              |
| `ASSET_RACK_NOT_FOUND`                     | 404  | Rack id/code not found                                               |
| `ASSET_NODE_NOT_FOUND`                     | 404  | Node id/code not found                                               |
| `ASSET_MARKER_NOT_FOUND`                   | 404  | Marker id/code not found                                             |
| `ASSET_MARKER_ALREADY_MAPPED`              | 400  | Marker already mapped (not currently emitted by routes but reserved) |
| `ASSET_MARKER_TARGET_INVALID`              | 404  | Marker is not mapped to any asset                                    |
| `ASSET_CODE_CONFLICT`                      | 400  | Code already in use (rack/node/marker)                               |
| `ASSET_PARENT_INVALID`                     | 400  | Parent relationship invalid (e.g. retire rack with nodes)            |
| `ASSET_NODE_ALREADY_ASSIGNED`              | 400  | Node already assigned to that rack                                   |
| `ASSET_TOPOLOGY_RELATION_INVALID`          | 400  | Topology relation invalid (reserved)                                 |
| `ASSET_SWITCH_NOT_FOUND`                   | 404  | Reserved (not emitted by current routes)                             |
| `ASSET_SERVICE_NOT_FOUND`                  | 404  | Reserved (not emitted by current routes)                             |
| `ASSET_CONTAINER_NOT_FOUND`                | 404  | Reserved (not emitted by current routes)                             |
| `ASSET_INVENTORY_SOURCE_NODE_UNREGISTERED` | 400  | Reserved (not emitted by current routes)                             |

---

## Pagination, Filtering & Sorting

Not implemented. List endpoints (`/assets/search`, `/admin/topology/discovered-nodes`, `/topology/tree`) return full collections. The only filtering is the optional `q` + `type` query on `/assets/search`.

---

## File Upload

Not implemented. No multipart endpoints.

---

## Business Notes

- **Code uniqueness.** `rackCode`, `nodeCode`, and `markerCode` are each globally unique across asset types. Codes are validated at creation and on rename.
- **Lifecycle transitions are guarded.** Each marker transition endpoint validates the current `lifecycleState` before moving to the next state. Invalid transitions return `400 INVALID_ARGUMENT` with reason `"Marker is not in the expected state."` (or similar).
- **Position codes** use `U<int>` format (e.g. `U1`, `U24`). They are validated against `capacityLimit` when set.
- **Rack capacity limit** is enforced when assigning nodes or updating `positionCode`. If `capacityLimit` is unset, no upper bound is applied.
- **Draining protection.** Assigning a node to a `DRAINING` rack requires `allowDraining=true`; otherwise `400`.
- **Retire semantics.**
  - Retiring a rack requires all nodes to have been unassigned; otherwise `400 ASSET_PARENT_INVALID`.
  - Retiring a node releases its rack assignment (`rackId → undefined`, `assignmentState → UNASSIGNED`).
  - Retiring a marker clears `isActive`, `isVisibleInAr`, and sets `bindingStatus = RETIRED`.
- **Remap semantics.** Remapping a marker resets it to `REMAPPED` / not active / pending validation. Refuses retired nodes.
- **Discovered nodes** live in Redis (separate source of truth). `assign-discovered-node-to-rack` is the only path that mutates them.
- **Caching.** Read endpoints (`/topology/tree`, `/racks/:id/topology`, `/nodes/:id/context`, `/markers/resolve/:code`) are cached server-side for **60 seconds** per cache key. Mutations invalidate the relevant cache keys.
- **Workload truth is external.** `NodeContextResult.externalContext.workloadSource` is hard-coded to `'monitoring-service-or-bff'`. Asset-service does not return workload data; the BFF or caller must merge it.
- **Node lookup by code.** `GET /nodes/:nodeId/context` and `PATCH /admin/topology/nodes/:nodeId` accept either a Mongo ObjectId or a `nodeCode` — the service tries `findById` first, then falls back to `findByCode`.
- **Monitoring-service ownership.** `POST /internal/inventory/sync` is retained only for backward compatibility and no longer mutates asset truth.

---

## Coverage Report

| Metric                 | Value                                                                                                                                                                                                                                                                                                                                                                                                                                |
| ---------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Controllers analyzed   | 5 (`HealthController`, `AssetQueryController`, `AdminTopologyController`, `AdminMarkersController`, `InternalInventoryController`)                                                                                                                                                                                                                                                                                                   |
| Endpoints documented   | 27 (1 health + 6 queries + 13 admin-topology + 9 admin-markers + 1 internal + 1 search)                                                                                                                                                                                                                                                                                                                                              |
| DTOs analyzed          | 7 (`CreateRackRequestDto`, `UpdateRackRequestDto`, `NormalizeNodeRequestDto`, `UpdateNodeRequestDto`, `AssignNodeToRackRequestDto`, `CreateMarkerRequestDto`, `UpdateMarkerRequestDto`, `RemapMarkerTargetRequestDto`, `SearchAssetsQueryDto`, `MetadataRequestDto`) — 10 DTO classes total                                                                                                                                          |
| Enums discovered       | 8 (`AssetType`, `MarkerTargetType`, `RackLifecycleState`, `RackCapacityState`, `NodeLifecycleState`, `NodeAssignmentState`, `MarkerLifecycleState`, `NodeHealthState`)                                                                                                                                                                                                                                                               |
| Error codes discovered | 19 (see Error Codes table)                                                                                                                                                                                                                                                                                                                                                                                                           |
| Missing / ambiguous    | No public endpoints missing. `ASSET_SWITCH_NOT_FOUND`, `ASSET_SERVICE_NOT_FOUND`, `ASSET_CONTAINER_NOT_FOUND`, `ASSET_INVENTORY_SOURCE_NODE_UNREGISTERED`, `ASSET_TOPOLOGY_RELATION_INVALID`, `ASSET_MARKER_ALREADY_MAPPED` are declared in the shared `ErrorCode` enum but not emitted by current asset-service routes (likely owned by other services or reserved). Pagination, sorting, and file upload are intentionally absent. |
