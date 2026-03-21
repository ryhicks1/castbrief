const APP_KEY = process.env.DROPBOX_APP_KEY!;
const APP_SECRET = process.env.DROPBOX_APP_SECRET!;
const REDIRECT_URI = process.env.DROPBOX_REDIRECT_URI!;

export function getAuthUrl(): string {
  const params = new URLSearchParams({
    client_id: APP_KEY,
    redirect_uri: REDIRECT_URI,
    response_type: "code",
    token_access_type: "offline",
  });
  return `https://www.dropbox.com/oauth2/authorize?${params.toString()}`;
}

export async function exchangeCodeForToken(code: string): Promise<{
  accessToken: string;
  refreshToken: string;
  accountId: string;
}> {
  const res = await fetch("https://api.dropboxapi.com/oauth2/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: `Basic ${Buffer.from(`${APP_KEY}:${APP_SECRET}`).toString("base64")}`,
    },
    body: new URLSearchParams({
      code,
      grant_type: "authorization_code",
      redirect_uri: REDIRECT_URI,
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Dropbox token exchange failed (${res.status}): ${text}`);
  }

  const data = await res.json();
  return {
    accessToken: data.access_token,
    refreshToken: data.refresh_token,
    accountId: data.account_id,
  };
}

export async function refreshAccessToken(
  refreshToken: string
): Promise<string> {
  const res = await fetch("https://api.dropboxapi.com/oauth2/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: `Basic ${Buffer.from(`${APP_KEY}:${APP_SECRET}`).toString("base64")}`,
    },
    body: new URLSearchParams({
      refresh_token: refreshToken,
      grant_type: "refresh_token",
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Dropbox token refresh failed (${res.status}): ${text}`);
  }

  const data = await res.json();
  return data.access_token;
}

export async function createFolder(
  accessToken: string,
  path: string
): Promise<{ id: string; pathDisplay: string }> {
  const res = await fetch(
    "https://api.dropboxapi.com/2/files/create_folder_v2",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ path, autorename: false }),
    }
  );

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Dropbox create folder failed (${res.status}): ${text}`);
  }

  const data = await res.json();
  return {
    id: data.metadata.id,
    pathDisplay: data.metadata.path_display,
  };
}

export async function createFileRequest(
  accessToken: string,
  title: string,
  folderPath: string
): Promise<{ id: string; url: string }> {
  const res = await fetch(
    "https://api.dropboxapi.com/2/file_requests/create",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ title, destination: folderPath, open: true }),
    }
  );

  if (!res.ok) {
    const text = await res.text();
    throw new Error(
      `Dropbox create file request failed (${res.status}): ${text}`
    );
  }

  const data = await res.json();
  return { id: data.id, url: data.url };
}

export async function getSharedFolderLink(
  accessToken: string,
  path: string
): Promise<string> {
  const res = await fetch(
    "https://api.dropboxapi.com/2/sharing/create_shared_link_with_settings",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        path,
        settings: { requested_visibility: "public" },
      }),
    }
  );

  if (!res.ok) {
    const text = await res.text();
    // If link already exists, parse the existing URL from the error
    if (res.status === 409) {
      try {
        const err = JSON.parse(text);
        if (err.error?.shared_link_already_exists?.metadata?.url) {
          return err.error.shared_link_already_exists.metadata.url;
        }
      } catch {
        // fall through
      }
    }
    throw new Error(
      `Dropbox create shared link failed (${res.status}): ${text}`
    );
  }

  const data = await res.json();
  return data.url;
}
