const NUM_FRAMES = 10; // Extract 10 frames for better reference
const MAX_DURATION_S = 10; // Max video duration in seconds

export const extractFramesFromVideo = (videoFile: File): Promise<{ data: string, mimeType: string }[]> => {
  return new Promise((resolve, reject) => {
    const video = document.createElement('video');
    video.preload = 'metadata';
    const videoUrl = URL.createObjectURL(videoFile);
    video.src = videoUrl;
    video.muted = true;

    const cleanup = () => {
      URL.revokeObjectURL(videoUrl);
      video.remove();
    };

    video.onloadedmetadata = async () => {
      if (video.duration > MAX_DURATION_S) {
        console.warn(`Video is longer than ${MAX_DURATION_S}s. Only the first ${MAX_DURATION_S} seconds will be used for frame extraction.`);
      }
      
      const durationToProcess = Math.min(video.duration, MAX_DURATION_S);

      const canvas = document.createElement('canvas');
      const context = canvas.getContext('2d');
      if (!context) {
        cleanup();
        reject(new Error('Could not get canvas context'));
        return;
      }

      const frames: { data: string, mimeType: string }[] = [];
      const interval = durationToProcess > 0 ? durationToProcess / NUM_FRAMES : 0;

      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      
      let framesExtracted = 0;

      const extractFrame = (time: number): Promise<void> => {
        return new Promise((resolveFrame, rejectFrame) => {
          video.currentTime = time;
          video.onseeked = () => {
            try {
              context.drawImage(video, 0, 0, canvas.width, canvas.height);
              const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
              const mimeType = 'image/jpeg';
              const base64Data = dataUrl.split(',')[1];
              frames.push({ data: base64Data, mimeType });
              framesExtracted++;
              resolveFrame();
            } catch (e) {
              rejectFrame(e);
            }
          };
          video.onerror = (e) => {
            rejectFrame(new Error('Error seeking video frame.'));
          };
        });
      };

      try {
        for (let i = 0; i < NUM_FRAMES; i++) {
          // Ensure we don't seek beyond the actual duration for the last frame
          const seekTime = Math.min(i * interval, durationToProcess);
          await extractFrame(seekTime);
        }
        cleanup();
        resolve(frames);
      } catch (e) {
        cleanup();
        reject(e);
      }
    };

    video.onerror = () => {
      cleanup();
      reject(new Error('Error loading video file. It may be corrupt or in an unsupported format.'));
    };

    // Start loading the video
    video.play().catch(() => {
        // Autoplay might be blocked, which is fine. The metadata should still load.
    });
  });
};