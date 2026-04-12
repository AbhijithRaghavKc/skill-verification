import { ethers } from "ethers";

const CONTRACT_ABI = [
  "function issueCredential(address holder, string calldata credentialHash, string calldata metadataURI) external returns (uint256)",
  "function verifyCredential(uint256 tokenId) external view returns (address holder, address issuer, string credentialHash, uint256 issuedAt, bool isValid)",
  "function revokeCredential(uint256 tokenId) external",
  "function getCredentialsByHolder(address holder) external view returns (uint256[])",
  "function getCredentialsByIssuer(address issuer) external view returns (uint256[])",
  "event CredentialIssued(uint256 indexed tokenId, address indexed holder, address indexed issuer, string credentialHash)",
  "event CredentialRevoked(uint256 indexed tokenId)",
];

function getProvider() {
  return new ethers.JsonRpcProvider(process.env.BLOCKCHAIN_RPC_URL);
}

function getSigner() {
  const provider = getProvider();
  return new ethers.Wallet(process.env.BLOCKCHAIN_PRIVATE_KEY!, provider);
}

function getContract(signerOrProvider?: ethers.Signer | ethers.Provider) {
  const contractAddress = process.env.CONTRACT_ADDRESS;
  if (!contractAddress) throw new Error("Contract address not configured");
  return new ethers.Contract(
    contractAddress,
    CONTRACT_ABI,
    signerOrProvider || getProvider(),
  );
}

export async function issueCredentialOnChain(
  holderAddress: string,
  credentialHash: string,
  metadataURI: string,
): Promise<{ txHash: string; tokenId: string }> {
  const signer = getSigner();
  const contract = getContract(signer);

  const tx = await contract.issueCredential(
    holderAddress,
    credentialHash,
    metadataURI,
  );
  const receipt = await tx.wait();

  // Parse logs through the contract interface to reliably extract the tokenId
  let tokenId = "0";
  for (const log of receipt.logs) {
    try {
      const parsed = contract.interface.parseLog({
        topics: log.topics as string[],
        data: log.data,
      });
      if (parsed && parsed.name === "CredentialIssued") {
        tokenId = parsed.args[0].toString();
        break;
      }
    } catch {
      // Not a matching log, skip
    }
  }

  // Fallback: check Transfer event (ERC721 mint emits Transfer(address(0), to, tokenId))
  if (tokenId === "0") {
    const transferTopic = ethers.id("Transfer(address,address,uint256)");
    const transferLog = receipt.logs.find(
      (log: ethers.Log) => log.topics[0] === transferTopic,
    );
    if (transferLog && transferLog.topics.length >= 4) {
      tokenId = ethers.toBigInt(transferLog.topics[3]).toString();
    }
  }

  return {
    txHash: receipt.hash,
    tokenId,
  };
}

export async function verifyCredentialOnChain(tokenId: string): Promise<{
  holder: string;
  issuer: string;
  credentialHash: string;
  issuedAt: number;
  isValid: boolean;
}> {
  const contract = getContract();
  const result = await contract.verifyCredential(tokenId);

  return {
    holder: result[0],
    issuer: result[1],
    credentialHash: result[2],
    issuedAt: Number(result[3]),
    isValid: result[4],
  };
}

export async function revokeCredentialOnChain(
  tokenId: string,
): Promise<string> {
  const signer = getSigner();
  const contract = getContract(signer);

  const tx = await contract.revokeCredential(tokenId);
  const receipt = await tx.wait();
  return receipt.hash;
}

export async function getHolderCredentials(
  holderAddress: string,
): Promise<string[]> {
  const contract = getContract();
  const tokenIds = await contract.getCredentialsByHolder(holderAddress);
  return tokenIds.map((id: bigint) => id.toString());
}

export function generateCredentialHash(data: {
  candidateId: string;
  issuerId: string;
  title: string;
  skills: string[];
  issuedAt: string;
}): string {
  const encoded = ethers.AbiCoder.defaultAbiCoder().encode(
    ["string", "string", "string", "string[]", "string"],
    [data.candidateId, data.issuerId, data.title, data.skills, data.issuedAt],
  );
  return ethers.keccak256(encoded);
}
