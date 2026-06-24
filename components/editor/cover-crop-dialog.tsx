"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Cropper, { type Area, type Point } from "react-easy-crop";
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

export function CoverCropDialog({
  file,
  onCancel,
  onCropped,
}: {
  file: File | null;
  onCancel: () => void;
  onCropped: (blob: Blob) => void;
}) {
  const src = useMemo(() => (file ? URL.createObjectURL(file) : null), [file]);
  const [crop, setCrop] = useState<Point>({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [area, setArea] = useState<Area | null>(null);
  const [busy, setBusy] = useState(false);

  // Revoke the object URL when it changes / on unmount. Control state resets
  // naturally because the parent remounts this dialog per file (keyed).
  useEffect(() => {
    return () => {
      if (src) URL.revokeObjectURL(src);
    };
  }, [src]);

  const onComplete = useCallback(
    (_a: Area, pixels: Area) => setArea(pixels),
    [],
  );

  async function apply() {
    if (!src || !area) return;
    setBusy(true);
    try {
      const blob = await getCroppedBlob(src, area);
      onCropped(blob);
    } finally {
      setBusy(false);
    }
  }

  return (
    <Dialog
      open={!!file}
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
          <span className="w-12 text-xs text-muted-foreground">Zoom</span>
          <Slider
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
