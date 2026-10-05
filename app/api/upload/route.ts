import { issueSignedToken } from "@vercel/blob";
import { handleUploadPresigned, type HandleUploadPresignedBody } from "@vercel/blob/client";
import { NextResponse } from "next/server";
import { requireBlob } from "@/lib/config";
import { AppError, withErrors } from "@/lib/errors";
import { getSessionEmail } from "@/lib/session";

// Resend's limit is 40MB per email after base64 encoding.
const MAX_FILE_BYTES = 25 * 1024 * 1024;

export const POST = withErrors(async (req: Request) => {
  if (!(await getSessionEmail())) {
    throw new AppError(401, "Your session has expired. Sign in again.", undefined, "unauthorized");
  }
  requireBlob();
  const body = (await req.json()) as HandleUploadPresignedBody;
  try {
    const json = await handleUploadPresigned({
      body,
      request: req,
      getSignedToken: async (pathname) => ({
        token: await issueSignedToken({
          pathname,
          operations: ["put"],
          maximumSizeInBytes: MAX_FILE_BYTES,
          validUntil: Date.now() + 10 * 60 * 1000,
        }),
        urlOptions: { maximumSizeInBytes: MAX_FILE_BYTES, addRandomSuffix: true },
      }),
    });
    return NextResponse.json(json);
  } catch (e) {
    if (e instanceof AppError) throw e;
    throw new AppError(502, `File storage error: ${(e as Error).message}`, "Check the Blob store connection in Vercel → Storage.", "blob_error");
  }
});
