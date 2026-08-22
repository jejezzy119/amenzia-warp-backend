import nacl from "tweetnacl";
import { config } from "../config.js";

export interface WarpKeys {
  privateKey: string;
  publicKey: string;
}

export interface WarpConfig {
  ipv4: string;
  ipv6: string;
  peerPublicKey: string;
  endpointHost: string;
  endpointIpv4: string;
  endpointIpv6: string;
}

export interface WarpRegistrationResponse {
  id: string;
  token: string;
  account: {
    id: string;
    account_type: string;
  };
  config: {
    interface: {
      addresses: {
        v4: string;
        v6: string;
      };
    };
    peers: Array<{
      public_key: string;
      endpoint: {
        host: string;
        ports: number[];
      };
    }>;
  };
}

export function generateWarpKeys(): WarpKeys {
  const privateKey = new Uint8Array(32);

  crypto.getRandomValues(privateKey);

  privateKey[0]! &= 248;
  privateKey[31]! &= 127;
  privateKey[31]! |= 64;

  const publicKey = nacl.scalarMult.base(privateKey);

  return {
    privateKey: Buffer.from(privateKey).toString("base64"),
    publicKey: Buffer.from(publicKey).toString("base64"),
  };
}

function createRegistrationBody(publicKey: string) {
  const installId = crypto.randomUUID();

  return {
    key: publicKey,
    install_id: installId,
    fcm_token: "",
    tos: new Date().toISOString(),
    model: "PC",
    serial_number: installId,
    locale: "en_US",
  };
}

export async function registerWarp() {
  const keys = generateWarpKeys();

  const body = createRegistrationBody(keys.publicKey);

  const response = await fetch(
    `https://api.cloudflareclient.com/${config.warp.apiVersion}/reg`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "User-Agent": "okhttp/3.12.1",
        "CF-Client-Version": "a-6.10-2158",
      },
      body: JSON.stringify(body),
    },
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(
      `WARP registration failed (${response.status}): ${JSON.stringify(data)}`,
    );
  }

  return {
    keys,
    data,
  };
}

export function parseWarpConfig(data: any): WarpConfig {
  const addresses = data.config.interface.addresses;
  const peer = data.config.peers[0];

  return {
    ipv4: addresses.v4,
    ipv6: addresses.v6,
    peerPublicKey: peer.public_key,
    endpointHost: peer.endpoint.host,
    endpointIpv4: peer.endpoint.v4,
    endpointIpv6: peer.endpoint.v6,
  };
}
