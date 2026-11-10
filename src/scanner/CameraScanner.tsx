import { useEffect, useRef, useState } from "react";
import { X } from "lucide-react";
import { BrowserMultiFormatReader, type IScannerControls } from "@zxing/browser";
import { BarcodeFormat, DecodeHintType } from "@zxing/library";

const hints = new Map();
hints.set(DecodeHintType.POSSIBLE_FORMATS, [BarcodeFormat.EAN_13, BarcodeFormat.EAN_8, BarcodeFormat.UPC_A, BarcodeFormat.UPC_E]);
hints.set(DecodeHintType.TRY_HARDER, true);

/** Caméra plein écran qui lit les codes-barres produits (EAN/UPC). */
export default function CameraScanner({ onDetected, onClose }: { onDetected: (code: string) => void; onClose: () => void }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [error, setError] = useState<string | null>(null);
  const done = useRef(false);

  useEffect(() => {
    let controls: IScannerControls | null = null;
    let cancelled = false;
    const reader = new BrowserMultiFormatReader(hints, { delayBetweenScanAttempts: 120 });
    reader
      .decodeFromConstraints(
        { video: { facingMode: { ideal: "environment" }, width: { ideal: 1280 }, height: { ideal: 720 } }, audio: false },
        videoRef.current!,
        (result, _err, c) => {
          if (result && !done.current) {
            done.current = true;
            c.stop();
            try {
              navigator.vibrate?.(60);
            } catch {
              /* iOS */
            }
            onDetected(result.getText());
          }
        },
      )
      .then((c) => {
        controls = c;
        if (cancelled) c.stop();
      })
      .catch((e: unknown) => {
        const name = e instanceof Error ? e.name : "";
        setError(
          name === "NotAllowedError"
            ? "Accès à la caméra refusé. Autorise-le dans Réglages › Safari › Caméra (ou Réglages › Mijote), puis réessaie."
            : name === "NotFoundError"
              ? "Aucune caméra trouvée sur cet appareil."
              : "Impossible d'ouvrir la caméra. Tu peux taper le code à la main.",
        );
      });
    return () => {
      cancelled = true;
      controls?.stop();
    };
  }, [onDetected]);

  return (
    <div className="camera">
      <video ref={videoRef} className="camera__video" playsInline muted autoPlay />
      <div className="camera__mask">
        <div className="camera__frame">
          <span className="camera__laser" />
        </div>
        <p>{error ?? "Vise le code-barres du produit"}</p>
      </div>
      <button className="camera__close" onClick={onClose} aria-label="Fermer">
        <X size={24} />
      </button>
    </div>
  );
}
