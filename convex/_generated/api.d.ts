/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as appointments from "../appointments.js";
import type * as clients from "../clients.js";
import type * as dashboard from "../dashboard.js";
import type * as http from "../http.js";
import type * as pets from "../pets.js";
import type * as sessions from "../sessions.js";
import type * as shops from "../shops.js";
import type * as users from "../users.js";
import type * as vaccinations from "../vaccinations.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  appointments: typeof appointments;
  clients: typeof clients;
  dashboard: typeof dashboard;
  http: typeof http;
  pets: typeof pets;
  sessions: typeof sessions;
  shops: typeof shops;
  users: typeof users;
  vaccinations: typeof vaccinations;
}>;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

export declare const components: {};
