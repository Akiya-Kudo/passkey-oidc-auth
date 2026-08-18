import { RouterContext } from "@koa/router";
import { DefaultContext, DefaultState, ParameterizedContext } from "koa";

export type InteractionRouterContext = ParameterizedContext<DefaultState, RouterContext<DefaultState, DefaultContext, unknown>, unknown>