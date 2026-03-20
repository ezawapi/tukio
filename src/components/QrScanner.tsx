import { useEffect, useRef, useState } from "react";
import { Html5Qrcode } from "html5-qrcode";
import { Camera, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";

interface QrScannerProps {
  onScan: (token: string) => void;
}

const QrScanner = ({ onScan }: QrScannerProps) => {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const containerRef = useRef<string>("qr-reader-" + Math.random().toString(36).slice(2));

  const startScanner = async () => {
    setError(null);
    try {
      const scanner = new Html5Qrcode(containerRef.current);
      scannerRef.current = scanner;

      await scanner.start(
        { facingMode: "environment" },
        { fps: 10, qrbox: { width: 250, height: 250 } },
        (decodedText) => {
          // Extract QR token from URL like .../events/xxx?qr=TOKEN
          const match = decodedText.match(/[?&]qr=([^&]+)/);
          const token = match ? match[1] : decodedText;
          onScan(token);
          stopScanner();
          setOpen(false);
        },
        () => {} // ignore scan failures
      );
    } catch (err: any) {
      setError(err?.message || "Impossible d'accéder à la caméra");
    }
  };

  const stopScanner = async () => {
    try {
      if (scannerRef.current?.isScanning) {
        await scannerRef.current.stop();
      }
      scannerRef.current?.clear();
    } catch {}
    scannerRef.current = null;
  };

  useEffect(() => {
    if (open) {
      // Small delay to ensure the DOM element is rendered
      setTimeout(startScanner, 300);
    } else {
      stopScanner();
    }
    return () => { stopScanner(); };
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" className="gap-2 gradient-hero border-0 text-primary-foreground">
          <Camera className="h-4 w-4" />
          Scanner QR
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="text-center">Scanner un QR Code</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col items-center gap-4 py-2">
          <div
            id={containerRef.current}
            className="w-full max-w-[300px] aspect-square rounded-lg overflow-hidden bg-muted"
          />
          {error && (
            <p className="text-sm text-destructive text-center">{error}</p>
          )}
          <p className="text-xs text-muted-foreground text-center">
            Pointez la caméra vers le QR code de l'invité
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default QrScanner;
