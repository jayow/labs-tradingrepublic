"use client";

import { useCallback, useState } from "react";
import Cropper, { type Area, type Point } from "react-easy-crop";
import "react-easy-crop/react-easy-crop.css";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { getCroppedBlob } from "@/lib/crop-image";

// `src` is always a data URL (the parent reads files / fetches existing covers
// into one), so the crop canvas is never tainted. Parent remounts this per open
// (keyed), so crop/zoom start fresh with no reset effect needed.
export function CoverCropDialog({
  src,
  onCancel,
  onCropped,
}: {
  src: string | null;
  onCancel: () => void;
  onCropped: (blob: Blob) => void;
}) {
  const [crop, setCrop] = useState<Point>({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [area, setArea] = useState<Area | null>(null);
  const [busy, setBusy] = useState(false);

  const onComplete = useCallback(
    (_a: Area, pixels: Area) => setArea(pixels),
    [],
  );

  async function apply() {
    if (!src || !area) return;
    setBusy(true);
    try {
      onCropped(await getCroppedBlob(src, area));
    } finally {
      setBusy(false);
    }
  }

  return (
    <Dialog
      open={!!src}
      onOpenChange={(open) => {
        if (!open) onCancel();
      }}
    >
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Position cover image</DialogTitle>
        </DialogHeader>

        <div className="relative h-64 w-full overflow-hidden rounded-lg bg-black">
          {src && (
            <Cropper
              image={src}
              crop={crop}
              zoom={zoom}
              aspect={2 / 1}
              onCropChange={setCrop}
              onZoomChange={setZoom}
              onCropComplete={onComplete}
            />
          )}
        </div>

        <div className="flex items-center gap-3">
          <span className="w-10 shrink-0 text-xs text-muted-foreground">
            Zoom
          </span>
          <Slider
            className="flex-1 [&_[data-slot=slider-track]]:h-1.5 [&_[data-slot=slider-track]]:bg-white/20"
            min={1}
            max={3}
            step={0.01}
            value={[zoom]}
            onValueChange={(v) => setZoom(v[0])}
          />
        </div>
        <p className="text-xs text-muted-foreground">
          Drag to reposition, scroll or use the slider to zoom.
        </p>

        <DialogFooter>
          <Button variant="outline" onClick={onCancel} disabled={busy}>
            Cancel
          </Button>
          <Button onClick={apply} disabled={busy || !area}>
            {busy ? "Applying…" : "Apply"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
