import axios from "axios";

type BlockchainResponse = {
  error?: {
    code: number;
    message: string;
    data?: string;
  };
  result?: {
    last_height: string;
  };
};

export async function fetchLatestBlockHeight(rpcEndpoint: string): Promise<number> {
  const response = (
    await axios.post<BlockchainResponse>(rpcEndpoint, {
      jsonrpc: "2.0",
      id: new Date().getTime(),
      method: "blockchain",
      params: {},
    })
  ).data;

  if (!response.result || response.error) {
    throw new Error(`${response.error?.message} | Error data: ` + response.error?.data);
  }

  return Number(response.result.last_height);
}
