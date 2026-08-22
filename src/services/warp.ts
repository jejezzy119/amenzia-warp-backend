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
  endpointPorts: number[];
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
        v4?: string;
        v6?: string;
      };
    }>;
  };
}

export function generateWarpKeys(): WarpKeys {
  const privateKey = new Uint8Array(32);

  crypto.getRandomValues(privateKey);

  // Clamp Curve25519 private key
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

  const data = (await response.json()) as
    | WarpRegistrationResponse
    | Record<string, unknown>;

  if (!response.ok) {
    throw new Error(
      `WARP registration failed (${response.status}): ${JSON.stringify(data)}`,
    );
  }

  /*
   * Safe debug logging.
   *
   * We intentionally DO NOT log:
   * - privateKey
   * - token
   * - registration secrets
   */
  const registration = data as WarpRegistrationResponse;

  console.log("WARP registration successful:");
  console.log(
    JSON.stringify(
      {
        id: registration.id,
        account: registration.account,
        interface: registration.config?.interface,
        peers: registration.config?.peers?.map((peer) => ({
          public_key: peer.public_key,
          endpoint: peer.endpoint,
        })),
      },
      null,
      2,
    ),
  );

  return {
    keys,
    data: registration,
  };
}

export function parseWarpConfig(data: WarpRegistrationResponse): WarpConfig {
  const addresses = data.config.interface.addresses;

  if (!addresses?.v4) {
    throw new Error("WARP registration response has no IPv4 address");
  }

  if (!data.config.peers || data.config.peers.length === 0) {
    throw new Error("WARP registration response has no peers");
  }

  const peer = data.config.peers[0];

  if (!peer) {
    throw new Error("WARP peer is undefined");
  }

  if (!peer.public_key) {
    throw new Error("WARP peer has no public key");
  }

  if (!peer.endpoint?.host) {
    throw new Error("WARP peer has no endpoint host");
  }

  return {
    ipv4: addresses.v4,
    ipv6: addresses.v6,
    peerPublicKey: peer.public_key,
    endpointHost: peer.endpoint.host,
    endpointPorts: peer.endpoint.ports ?? [],
  };
}
