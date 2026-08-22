import type { WarpKeys } from "./warp.js";

export interface Awg2Config {
  privateKey: string;
  address: string;
  dns: string;
  mtu: number;

  jc: number;
  jmin: number;
  jmax: number;

  s1: number;
  s2: number;
  s3: number;
  s4: number;

  h1: number;
  h2: number;
  h3: number;
  h4: number;

  peerPublicKey: string;
  allowedIPs: string[];
  endpoint: string;
}

interface WarpData {
  ipv4: string;
  ipv6: string;
  peerPublicKey: string;
  endpointHost: string;
  endpointIpv4?: string;
  endpointIpv6?: string;
}

export function buildAwg2Config(keys: WarpKeys, warp: WarpData): Awg2Config {
  return {
    privateKey: keys.privateKey,

    address: warp.ipv4,

    dns: "1.1.1.1",
    mtu: 1280,

    jc: 3,
    jmin: 64,
    jmax: 128,

    s1: 0,
    s2: 0,
    s3: 0,
    s4: 0,

    h1: 1,
    h2: 2,
    h3: 3,
    h4: 4,

    peerPublicKey: warp.peerPublicKey,

    allowedIPs: ["0.0.0.0/0"],

    endpoint: warp.endpointHost,
  };
}
