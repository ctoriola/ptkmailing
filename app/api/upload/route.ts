import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";
import { NextResponse } from "next/server";
import { requireEnv } from "@/lib/config";
import { AppError, errorResponse } from "@/lib/errors";
import { getSessionEmail } from "@/lib/session";

// Resend's limit is 40MB per email after base64 encoding.
const MAX_FILE_BYTES = 25 * 1024 * 1024;

export async function POST(req: Request) {
  try {
    requireEnv("BLOB_READ_WRITE_TOKEN");
    const body = (await req.json()) as HandleUploadBody;
    const json = await handleUpload({
      body,
      request: req,
      onBeforeGenerateToken: async () => {
        if (!(await getSessionEmail())) throw new AppError(401, "Your session has expired. Sign in again.", undefined, "unauthorized");
        return { maximumSizeInBytes: MAX_FILE_BYTES, addRandomSuffix: true };
      },
    });
    return NextResponse.json(json);
  } catch (e) {
    return errorResponse(e);
  }
}
