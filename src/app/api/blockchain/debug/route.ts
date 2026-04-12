import { NextResponse } from "next/server";
import { ethers } from "ethers";

export async function GET() {
  try {
    const rpcUrl = process.env.BLOCKCHAIN_RPC_URL;
    const contractAddress = process.env.CONTRACT_ADDRESS;
    const privateKey = process.env.BLOCKCHAIN_PRIVATE_KEY;

    const provider = new ethers.JsonRpcProvider(rpcUrl);
    const wallet = new ethers.Wallet(privateKey!, provider);

    // Check if there's any code at the contract address
    const code = await provider.getCode(contractAddress!);
    const hasCode = code !== "0x";

    // Check wallet balance
    const balance = await provider.getBalance(wallet.address);

    // Check network
    const network = await provider.getNetwork();

    // Try to get the transaction receipt and parse logs for the known tx
    const knownTxHash =
      "0xa0230e6af471481eb439ab579d5309ef7e21a1dfe70413ac728dc45e493fb3d6";
    let txLogs = null;
    try {
      const receipt = await provider.getTransactionReceipt(knownTxHash);
      if (receipt) {
        txLogs = receipt.logs.map((log) => ({
          address: log.address,
          topics: log.topics,
          data: log.data,
        }));
      }
    } catch (e) {
      txLogs = { error: e instanceof Error ? e.message : String(e) };
    }

    return NextResponse.json({
      success: true,
      data: {
        contractAddress,
        rpcUrl,
        walletAddress: wallet.address,
        walletBalance: ethers.formatEther(balance) + " MATIC",
        network: { name: network.name, chainId: Number(network.chainId) },
        contractHasCode: hasCode,
        contractCodeLength: code.length,
        txLogs,
      },
    });
  } catch (err: unknown) {
    return NextResponse.json({
      success: false,
      error: err instanceof Error ? err.message : String(err),
    });
  }
}

