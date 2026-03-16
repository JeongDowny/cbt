"use client";

const DEFAULT_MAX_DIMENSION = 1600;

function loadImageFromFile(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    const url = URL.createObjectURL(file);

    image.onload = () => {
      URL.revokeObjectURL(url);
      resolve(image);
    };
    image.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("이미지를 불러오지 못했습니다."));
    };
    image.src = url;
  });
}

function canvasToBlob(canvas: HTMLCanvasElement, quality: number): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error("이미지 변환에 실패했습니다."));
          return;
        }
        resolve(blob);
      },
      "image/jpeg",
      quality
    );
  });
}

function getResizedDimensions(width: number, height: number, maxDimension: number) {
  const longest = Math.max(width, height);
  if (longest <= maxDimension) {
    return { width, height };
  }

  const scale = maxDimension / longest;
  return {
    width: Math.max(1, Math.round(width * scale)),
    height: Math.max(1, Math.round(height * scale)),
  };
}

export async function compressImageToMaxSize(
  file: File,
  options?: {
    maxBytes?: number;
    maxDimension?: number;
  }
): Promise<File> {
  const maxBytes = options?.maxBytes ?? 1024 * 1024;
  const maxDimension = options?.maxDimension ?? DEFAULT_MAX_DIMENSION;
  const image = await loadImageFromFile(file);
  const canvas = document.createElement("canvas");
  const context = canvas.getContext("2d");

  if (!context) {
    throw new Error("이미지 압축을 위한 캔버스를 만들지 못했습니다.");
  }

  let { width, height } = getResizedDimensions(image.width, image.height, maxDimension);
  let bestBlob: Blob | null = null;
  const qualitySteps = [0.92, 0.84, 0.76, 0.68, 0.6, 0.52, 0.44];

  for (let resizeStep = 0; resizeStep < 6; resizeStep += 1) {
    canvas.width = width;
    canvas.height = height;
    context.clearRect(0, 0, width, height);
    context.drawImage(image, 0, 0, width, height);

    for (const quality of qualitySteps) {
      const blob = await canvasToBlob(canvas, quality);
      if (!bestBlob || blob.size < bestBlob.size) {
        bestBlob = blob;
      }
      if (blob.size <= maxBytes) {
        const baseName = file.name.replace(/\.[^.]+$/, "") || "work-image";
        return new File([blob], `${baseName}.jpg`, {
          type: "image/jpeg",
          lastModified: Date.now(),
        });
      }
    }

    width = Math.max(1, Math.round(width * 0.85));
    height = Math.max(1, Math.round(height * 0.85));
  }

  if (bestBlob && bestBlob.size <= maxBytes) {
    const baseName = file.name.replace(/\.[^.]+$/, "") || "work-image";
    return new File([bestBlob], `${baseName}.jpg`, {
      type: "image/jpeg",
      lastModified: Date.now(),
    });
  }

  throw new Error("이미지 크기를 1MB 이하로 줄이지 못했습니다.");
}
