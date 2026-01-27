
// Utility to handle Google Drive Picker interactions

const SCOPES = 'https://www.googleapis.com/auth/drive.readonly';
const DISCOVERY_DOCS = ['https://www.googleapis.com/discovery/v1/apis/drive/v3/rest'];

let gapiLoaded = false;
let gisLoaded = false;

const loadScript = (src: string): Promise<void> => {
  return new Promise((resolve, reject) => {
    if (document.querySelector(`script[src="${src}"]`)) {
      resolve();
      return;
    }
    const script = document.createElement('script');
    script.src = src;
    script.async = true;
    script.defer = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error(`Failed to load script: ${src}`));
    document.body.appendChild(script);
  });
};

export const initializeGoogleDrive = async (): Promise<void> => {
  try {
    await Promise.all([
      loadScript('https://apis.google.com/js/api.js'),
      loadScript('https://accounts.google.com/gsi/client'),
    ]);

    await new Promise<void>((resolve) => {
      (window as any).gapi.load('client:picker', async () => {
        await (window as any).gapi.client.init({
            discoveryDocs: DISCOVERY_DOCS,
        });
        gapiLoaded = true;
        resolve();
      });
    });

    gisLoaded = true;
  } catch (error) {
    console.error('Error initializing Google Drive API:', error);
    throw error;
  }
};

export const saveClientId = (clientId: string) => {
    localStorage.setItem('GOOGLE_CLIENT_ID', clientId.trim());
};

export const openGoogleDrivePicker = async (apiKey: string): Promise<File | null> => {
  if (!gapiLoaded || !gisLoaded) {
    await initializeGoogleDrive();
  }
  
  // Check environment variable first, then local storage
  let clientId = process.env.GOOGLE_CLIENT_ID || localStorage.getItem('GOOGLE_CLIENT_ID');
  
  if (!clientId) {
     // Throw specific error for UI to handle (show Modal)
     throw new Error("MISSING_CLIENT_ID");
  }

  return new Promise((resolve, reject) => {
    try {
      const tokenClient = (window as any).google.accounts.oauth2.initTokenClient({
        client_id: clientId!,
        scope: SCOPES,
        callback: async (response: any) => {
          if (response.error !== undefined) {
            console.error("Token Client Error:", response);
            // If the error is related to invalid client_id, clear it from local storage so user can try again
            if (response.error === 'invalid_client' || response.error.includes('client_id')) {
                localStorage.removeItem('GOOGLE_CLIENT_ID');
                reject(new Error("INVALID_CLIENT_ID"));
            } else {
                reject(response);
            }
            return;
          }
          createPicker(response.access_token);
        },
      });

      // Request an access token
      tokenClient.requestAccessToken();
    } catch (e) {
         localStorage.removeItem('GOOGLE_CLIENT_ID');
         reject(new Error("FAILED_TO_INIT_TOKEN_CLIENT"));
    }

    const createPicker = (accessToken: string) => {
      const picker = new (window as any).google.picker.PickerBuilder()
        .addView((window as any).google.picker.ViewId.DOCS) // Docs view
        .setOAuthToken(accessToken)
        .setDeveloperKey(apiKey)
        .setCallback(async (data: any) => {
          if (data.action === (window as any).google.picker.Action.PICKED) {
            const doc = data.docs[0];
            const fileId = doc.id;
            const mimeType = doc.mimeType;
            const name = doc.name;

            try {
                // We must download the file content using the Drive API
                const response = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`, {
                    headers: {
                        'Authorization': `Bearer ${accessToken}`
                    }
                });
                
                if (!response.ok) throw new Error('Network response was not ok');
                
                const blob = await response.blob();
                const file = new File([blob], name, { type: mimeType });
                resolve(file);

            } catch (e) {
                console.error("Error downloading file from Drive:", e);
                reject(new Error("Failed to download selected file from Google Drive."));
            }
          } else if (data.action === (window as any).google.picker.Action.CANCEL) {
            resolve(null);
          }
        })
        .build();
      picker.setVisible(true);
    };
  });
};
