import type { Awg2Config } from "./awg.js";

export function writeAwg2Config(config: Awg2Config): string {
  return `[Interface]
PrivateKey = ${config.privateKey}
Address = ${config.address}
DNS = ${config.dns}
MTU = ${config.mtu}

Jc = ${config.jc}
Jmin = ${config.jmin}
Jmax = ${config.jmax}

S1 = ${config.s1}
S2 = ${config.s2}
S3 = ${config.s3}
S4 = ${config.s4}

H1 = ${config.h1}
H2 = ${config.h2}
H3 = ${config.h3}
H4 = ${config.h4}

[Peer]
PublicKey = ${config.peerPublicKey}
AllowedIPs = ${config.allowedIPs.join(", ")}
Endpoint = ${config.endpoint}
`;
}
