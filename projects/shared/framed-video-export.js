(function () {
  const wait = (milliseconds) =>
    new Promise((resolve) => window.setTimeout(resolve, milliseconds));

  function preferredMimeType() {
    const candidates = [
      "video/webm;codecs=vp9",
      "video/webm;codecs=vp8",
      "video/webm",
      "video/mp4"
    ];
    return candidates.find((type) => MediaRecorder.isTypeSupported(type)) || "";
  }

  async function svgToBitmap(svg) {
    if (!svg) return null;
    const clone = svg.cloneNode(true);
    clone.setAttribute("xmlns", "http://www.w3.org/2000/svg");
    clone.setAttribute("width", "900");
    clone.setAttribute("height", "1120");
    const markup = new XMLSerializer().serializeToString(clone);
    const blob = new Blob([markup], { type: "image/svg+xml" });
    const url = URL.createObjectURL(blob);

    return new Promise((resolve, reject) => {
      const image = new Image();
      image.addEventListener("load", () => {
        URL.revokeObjectURL(url);
        resolve(image);
      }, { once: true });
      image.addEventListener("error", () => {
        URL.revokeObjectURL(url);
        reject(new Error("The cloud layer could not be prepared for export."));
      }, { once: true });
      image.src = url;
    });
  }

  function blobToImage(blob) {
    const url = URL.createObjectURL(blob);
    return new Promise((resolve, reject) => {
      const image = new Image();
      image.addEventListener("load", () => {
        URL.revokeObjectURL(url);
        resolve(image);
      }, { once: true });
      image.addEventListener("error", () => {
        URL.revokeObjectURL(url);
        reject(new Error("The frame photograph could not be prepared."));
      }, { once: true });
      image.src = url;
    });
  }

  function sourceToImage(source) {
    return new Promise((resolve, reject) => {
      const image = new Image();
      image.addEventListener("load", () => resolve(image), { once: true });
      image.addEventListener("error", () => {
        reject(new Error("The embedded frame photograph could not be prepared."));
      }, { once: true });
      image.src = source;
    });
  }

  async function loadCleanPhoto(photo, embeddedSource) {
    try {
      let image;
      if (embeddedSource) {
        image = await sourceToImage(embeddedSource);
      } else {
        const response = await fetch(photo.currentSrc || photo.src);
        if (!response.ok && response.status !== 0) {
          throw new Error("The frame photograph could not be loaded.");
        }
        image = await blobToImage(await response.blob());
      }
      const test = document.createElement("canvas");
      test.width = 2;
      test.height = 2;
      test.getContext("2d").drawImage(image, 0, 0, 2, 2);
      test.toDataURL();
      return image;
    } catch (error) {
      return null;
    }
  }

  window.createFramedVideoExporter = function createFramedVideoExporter(config) {
    let exporting = false;

    return async function exportRevealVideo(options = {}) {
      if (exporting) throw new Error("An export is already in progress.");
      if (!window.MediaRecorder || !HTMLCanvasElement.prototype.captureStream) {
        throw new Error("This browser does not support direct canvas video export.");
      }

      exporting = true;
      const photo = config.photo;
      const sourceCanvas = config.sourceCanvas();
      if (!photo || !sourceCanvas) {
        exporting = false;
        throw new Error("The framed scene is not ready yet.");
      }

      try {
        const cleanPhoto = await loadCleanPhoto(photo, config.photoData);
        const framed = Boolean(cleanPhoto);
        const output = document.createElement("canvas");
        output.width = framed ? cleanPhoto.naturalWidth : sourceCanvas.width;
        output.height = framed ? cleanPhoto.naturalHeight : sourceCanvas.height;
        const context = output.getContext("2d", {
          alpha: false,
          desynchronized: false
        });
        context.imageSmoothingEnabled = true;
        context.imageSmoothingQuality = "high";

        const svgBitmap = await svgToBitmap(config.svgLayer?.element || null);
        const frame = config.frame;
        const points = [frame.tl, frame.tr, frame.br, frame.bl];
        const minX = Math.min(...points.map((point) => point.x));
        const maxX = Math.max(...points.map((point) => point.x));
        const minY = Math.min(...points.map((point) => point.y));
        const maxY = Math.max(...points.map((point) => point.y));
        const frameWidth = maxX - minX;
        const frameHeight = maxY - minY;
        const centerX = points.reduce((sum, point) => sum + point.x, 0) / 4;
        const centerY = points.reduce((sum, point) => sum + point.y, 0) / 4;

        function drawLayer(layer, composite, alpha) {
          if (!layer || alpha <= 0) return;
          const placement = config.placement();
          const centerXPx =
            (centerX + placement.x * frameWidth) * output.width;
          const centerYPx =
            (centerY + placement.y * frameHeight) * output.height;
          const width = frameWidth * placement.scale * output.width;
          const height = width * (1120 / 900);
          context.globalCompositeOperation = composite;
          context.globalAlpha = alpha;
          context.drawImage(
            layer,
            centerXPx - width / 2,
            centerYPx - height / 2,
            width,
            height
          );
        }

        function renderFrame() {
          context.globalCompositeOperation = "source-over";
          context.globalAlpha = 1;
          if (!framed) {
            config.drawFallbackBackground(context, output.width, output.height);
            context.globalCompositeOperation =
              config.fallbackComposite || "source-over";
            context.globalAlpha = 1;
            context.drawImage(sourceCanvas, 0, 0, output.width, output.height);
            if (svgBitmap) {
              context.globalCompositeOperation =
                config.svgLayer.composite || "source-over";
              context.globalAlpha = config.svgLayer.alpha();
              context.drawImage(svgBitmap, 0, 0, output.width, output.height);
            }
            return;
          }

          context.drawImage(cleanPhoto, 0, 0, output.width, output.height);
          context.save();
          context.beginPath();
          points.forEach((point, index) => {
            const x = point.x * output.width;
            const y = point.y * output.height;
            if (index === 0) context.moveTo(x, y);
            else context.lineTo(x, y);
          });
          context.closePath();
          context.clip();
          drawLayer(sourceCanvas, config.composite || "source-over", 1);
          if (svgBitmap) {
            drawLayer(
              svgBitmap,
              config.svgLayer.composite || "source-over",
              config.svgLayer.alpha()
            );
          }
          context.restore();
        }

        config.reset();
        await wait(180);

        let animationFrame = 0;
        const renderContinuously = () => {
          renderFrame();
          animationFrame = requestAnimationFrame(renderContinuously);
        };
        renderContinuously();

        const stream = output.captureStream(60);
        const mimeType = preferredMimeType();
        const recorder = new MediaRecorder(stream, {
          ...(mimeType ? { mimeType } : {}),
          videoBitsPerSecond: options.videoBitsPerSecond || 40_000_000
        });
        const chunks = [];
        recorder.addEventListener("dataavailable", (event) => {
          if (event.data && event.data.size) chunks.push(event.data);
        });

        const stopped = new Promise((resolve, reject) => {
          recorder.addEventListener("stop", resolve, { once: true });
          recorder.addEventListener("error", () => reject(recorder.error), {
            once: true
          });
        });

        recorder.start(500);
        await wait(options.leadIn || 1200);
        config.reveal();
        await wait(options.revealDuration || 9000);
        recorder.stop();
        await stopped;
        cancelAnimationFrame(animationFrame);
        stream.getTracks().forEach((track) => track.stop());

        const finalType = recorder.mimeType || mimeType || "video/webm";
        const extension = finalType.includes("mp4") ? "mp4" : "webm";
        const video = new Blob(chunks, { type: finalType });
        const url = URL.createObjectURL(video);
        const link = document.createElement("a");
        link.href = url;
        link.download = `${config.fileName}.${extension}`;
        document.body.appendChild(link);
        link.click();
        link.remove();
        window.setTimeout(() => URL.revokeObjectURL(url), 3000);
        config.reset();

        return {
          width: output.width,
          height: output.height,
          fps: 60,
          mimeType: finalType,
          mode: framed ? "framed" : "isolation"
        };
      } finally {
        exporting = false;
      }
    };
  };
})();
