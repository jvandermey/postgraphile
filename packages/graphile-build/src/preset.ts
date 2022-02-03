import "./interfaces";

import type { Preset } from "graphile-plugin";

import {
  AddNodeInterfaceToSuitableTypesPlugin,
  BuiltinScalarConnectionsPlugin,
  ClientMutationIdDescriptionPlugin,
  CommonTypesPlugin,
  ConnectionPlugin,
  CursorTypePlugin,
  MutationPayloadQueryPlugin,
  MutationPlugin,
  NodeAccessorPlugin,
  NodeIdCodecBase64JSONPlugin,
  NodeIdCodecPipeStringPlugin,
  NodePlugin,
  PageInfoStartEndCursorPlugin,
  QueryPlugin,
  RegisterQueryNodePlugin,
  SubscriptionPlugin,
  TrimEmptyDescriptionsPlugin,
} from "./plugins/index.js";

export const defaultPreset: Preset = {
  plugins: [
    QueryPlugin,
    MutationPlugin,
    SubscriptionPlugin,
    ClientMutationIdDescriptionPlugin,
    MutationPayloadQueryPlugin,
    CursorTypePlugin,
    CommonTypesPlugin,
    NodePlugin,
    ConnectionPlugin,
    PageInfoStartEndCursorPlugin,
    BuiltinScalarConnectionsPlugin,
    TrimEmptyDescriptionsPlugin,
    AddNodeInterfaceToSuitableTypesPlugin,
    NodeIdCodecBase64JSONPlugin,
    NodeIdCodecPipeStringPlugin,
    RegisterQueryNodePlugin,
    NodeAccessorPlugin,
  ],
};