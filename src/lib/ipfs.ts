type CredentialMetadata = {
  name: string;
  description: string;
  image?: string;
  attributes: {
    trait_type: string;
    value: string | number;
  }[];
  issuer: {
    id: string;
    name: string;
  };
  issuedAt: string;
  skills: string[];
};

export async function uploadToIPFS(
  metadata: CredentialMetadata
): Promise<string> {
  const apiKey = process.env.IPFS_API_KEY;
  const apiSecret = process.env.IPFS_API_SECRET;

  if (!apiKey || !apiSecret) {
    // Fallback: generate a deterministic hash from metadata for development
    const encoder = new TextEncoder();
    const data = encoder.encode(JSON.stringify(metadata));
    const hashBuffer = await crypto.subtle.digest("SHA-256", data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
    return `Qm${hashHex.slice(0, 44)}`;
  }

  const body = JSON.stringify({
    pinataContent: metadata,
    pinataMetadata: {
      name: `credential-${metadata.name}`,
    },
  });

  const response = await fetch(
    "https://api.pinata.cloud/pinning/pinJSONToIPFS",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        pinata_api_key: apiKey,
        pinata_secret_api_key: apiSecret,
      },
      body,
    }
  );

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`IPFS upload failed: ${errorText}`);
  }

  const result = await response.json();
  return result.IpfsHash;
}

export function getIPFSUrl(hash: string): string {
  if (!hash) return "";
  if (hash.startsWith("ipfs://")) {
    hash = hash.replace("ipfs://", "");
  }
  return `https://gateway.pinata.cloud/ipfs/${hash}`;
}

export function buildCredentialMetadata(params: {
  title: string;
  description: string;
  issuerName: string;
  issuerId: string;
  skills: string[];
  type: string;
  issuedAt: string;
}): CredentialMetadata {
  return {
    name: params.title,
    description: params.description || `${params.type} credential issued by ${params.issuerName}`,
    attributes: [
      { trait_type: "Type", value: params.type },
      { trait_type: "Issuer", value: params.issuerName },
      { trait_type: "Skills Count", value: params.skills.length },
      ...params.skills.map((skill) => ({
        trait_type: "Skill",
        value: skill,
      })),
    ],
    issuer: {
      id: params.issuerId,
      name: params.issuerName,
    },
    issuedAt: params.issuedAt,
    skills: params.skills,
  };
}
