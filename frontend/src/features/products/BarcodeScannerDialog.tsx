import {
  BarcodeFormat,
  BrowserMultiFormatReader,
  type IScannerControls,
} from "@zxing/browser";
import { DecodeHintType } from "@zxing/library";
import { Camera, Keyboard, LoaderCircle, ScanBarcode, X } from "lucide-react";
import {
  type FormEvent,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import { errorMessage } from "../../lib/api";

type ScannerMode = "camera" | "manual";

type BarcodeScannerDialogProps = {
  onClose: () => void;
  onDetected: (code: string) => Promise<void>;
};

const hints = new Map<DecodeHintType, BarcodeFormat[]>([
  [
    DecodeHintType.POSSIBLE_FORMATS,
    [
      BarcodeFormat.EAN_13,
      BarcodeFormat.EAN_8,
      BarcodeFormat.UPC_A,
      BarcodeFormat.UPC_E,
      BarcodeFormat.CODE_128,
      BarcodeFormat.CODE_39,
      BarcodeFormat.ITF,
    ],
  ],
]);

export function BarcodeScannerDialog({
  onClose,
  onDetected,
}: BarcodeScannerDialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const manualInputRef = useRef<HTMLInputElement>(null);
  const controlsRef = useRef<IScannerControls | null>(null);
  const processingRef = useRef(false);
  const submitRef = useRef<(rawCode: string) => Promise<void>>(
    async () => undefined,
  );
  const [mode, setMode] = useState<ScannerMode>("camera");
  const [manualCode, setManualCode] = useState("");
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [submissionError, setSubmissionError] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);

  const stopCamera = useCallback(() => {
    controlsRef.current?.stop();
    controlsRef.current = null;
    const stream = videoRef.current?.srcObject;
    if (typeof MediaStream !== "undefined" && stream instanceof MediaStream) {
      stream.getTracks().forEach((track) => track.stop());
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  }, []);

  const processCode = useCallback(
    async (rawCode: string) => {
      const code = rawCode.trim().toUpperCase();
      if (code.length < 3 || code.length > 50) {
        setSubmissionError("El codigo debe tener entre 3 y 50 caracteres.");
        return;
      }
      if (processingRef.current) return;

      processingRef.current = true;
      setProcessing(true);
      setSubmissionError(null);
      setManualCode(code);
      stopCamera();

      try {
        await onDetected(code);
      } catch (error) {
        setSubmissionError(errorMessage(error));
        setMode("manual");
      } finally {
        processingRef.current = false;
        setProcessing(false);
      }
    },
    [onDetected, stopCamera],
  );

  useEffect(() => {
    submitRef.current = processCode;
  }, [processCode]);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (typeof dialog.showModal === "function") {
      dialog.showModal();
    } else {
      dialog.setAttribute("open", "");
    }
    return () => {
      if (typeof dialog.close === "function" && dialog.open) dialog.close();
    };
  }, []);

  useEffect(() => {
    if (mode !== "manual") return;
    stopCamera();
    manualInputRef.current?.focus();
  }, [mode, stopCamera]);

  useEffect(() => {
    if (mode !== "camera") return;
    setCameraError(null);
    if (!navigator.mediaDevices?.getUserMedia) {
      setCameraError(
        "Este navegador no permite usar la camara. Usa el lector USB o escribe el codigo.",
      );
      return;
    }

    let cancelled = false;
    const reader = new BrowserMultiFormatReader(hints, {
      delayBetweenScanAttempts: 120,
    });
    const start = async () => {
      try {
        const controls = await reader.decodeFromConstraints(
          { audio: false, video: { facingMode: { ideal: "environment" } } },
          videoRef.current ?? undefined,
          (result) => {
            if (result && !processingRef.current)
              void submitRef.current(result.getText());
          },
        );
        if (cancelled) {
          controls.stop();
        } else {
          controlsRef.current = controls;
        }
      } catch (error) {
        if (!cancelled) {
          setCameraError(
            error instanceof DOMException && error.name === "NotAllowedError"
              ? "No se concedio permiso para usar la camara. Puedes continuar con el lector USB."
              : "No pudimos iniciar la camara. Puedes continuar con el lector USB.",
          );
        }
      }
    };
    void start();

    return () => {
      cancelled = true;
      stopCamera();
    };
  }, [mode, stopCamera]);

  const submitManual = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    void processCode(manualCode);
  };

  return (
    <dialog
      ref={dialogRef}
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
      aria-labelledby="barcode-scanner-title"
      className="fixed inset-0 m-auto max-h-none w-full max-w-none overflow-y-auto bg-transparent p-0 backdrop:bg-slate-950/60 sm:w-[min(92vw,46rem)]"
    >
      <section className="min-h-dvh bg-white p-5 shadow-2xl sm:min-h-0 sm:rounded-3xl sm:p-7">
        <header className="mb-6 flex items-start justify-between gap-4">
          <div>
            <p className="brand-text mb-1 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em]">
              <ScanBarcode aria-hidden="true" size={18} /> Carga rapida
            </p>
            <h2
              id="barcode-scanner-title"
              className="text-2xl font-semibold tracking-tight"
            >
              Escanear codigo de barras
            </h2>
            <p className="mt-2 text-sm text-slate-600">
              Si el producto es nuevo podras asignarle un nombre y su stock
              inicial.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="icon-button"
            aria-label="Cerrar escaner"
          >
            <X aria-hidden="true" size={20} />
          </button>
        </header>

        <div
          role="group"
          aria-label="Metodo de lectura"
          className="mb-5 grid grid-cols-2 gap-2 rounded-2xl bg-slate-100 p-1.5"
        >
          <ModeButton
            active={mode === "camera"}
            onClick={() => setMode("camera")}
            icon={Camera}
          >
            Camara
          </ModeButton>
          <ModeButton
            active={mode === "manual"}
            onClick={() => setMode("manual")}
            icon={Keyboard}
          >
            Lector USB
          </ModeButton>
        </div>

        {mode === "camera" ? (
          <div role="tabpanel" className="space-y-4">
            <div className="relative aspect-[4/3] overflow-hidden rounded-2xl bg-slate-950">
              <video
                ref={videoRef}
                muted
                playsInline
                className="size-full object-cover"
                aria-label="Vista previa de la camara"
              />
              <div
                aria-hidden="true"
                className="pointer-events-none absolute inset-[18%_10%] rounded-2xl border-2 shadow-[0_0_0_999px_rgba(2,6,23,0.38)]"
                style={{ borderColor: "var(--business-accent)" }}
              />
              {processing ? <ProcessingOverlay /> : null}
            </div>
            <p className="text-center text-sm text-slate-600">
              Centra el codigo dentro del recuadro y manten el producto quieto.
            </p>
            {cameraError ? (
              <div
                role="alert"
                className="rounded-xl bg-amber-50 p-4 text-sm text-amber-900"
              >
                <p>{cameraError}</p>
                <button
                  type="button"
                  onClick={() => setMode("manual")}
                  className="mt-3 font-semibold underline underline-offset-4"
                >
                  Usar lector USB o entrada manual
                </button>
              </div>
            ) : null}
          </div>
        ) : (
          <div role="tabpanel" className="space-y-4">
            <form onSubmit={submitManual} className="space-y-4">
              <label className="grid gap-2 text-sm font-medium text-slate-700">
                Codigo de barras
                <input
                  ref={manualInputRef}
                  value={manualCode}
                  onChange={(event) => setManualCode(event.target.value)}
                  className="form-input font-mono text-lg tracking-wide"
                  placeholder="Escanea o escribe el codigo"
                  autoComplete="off"
                  inputMode="numeric"
                  disabled={processing}
                  aria-invalid={Boolean(submissionError)}
                />
              </label>
              <p className="text-sm text-slate-500">
                Los lectores USB normalmente escriben el codigo y presionan
                Enter automaticamente.
              </p>
              <button
                type="submit"
                className="button-primary w-full"
                disabled={processing}
              >
                {processing ? (
                  <LoaderCircle
                    className="animate-spin"
                    aria-hidden="true"
                    size={18}
                  />
                ) : (
                  <ScanBarcode aria-hidden="true" size={18} />
                )}
                {processing ? "Buscando producto" : "Buscar codigo"}
              </button>
            </form>
          </div>
        )}

        <div aria-live="assertive" aria-atomic="true">
          {submissionError ? (
            <p
              role="alert"
              className="mt-4 rounded-xl bg-red-50 p-4 text-sm text-red-700"
            >
              {submissionError}
            </p>
          ) : null}
        </div>
      </section>
    </dialog>
  );
}

function ModeButton({
  active,
  onClick,
  icon: Icon,
  children,
}: {
  active: boolean;
  onClick: () => void;
  icon: typeof Camera;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={`brand-interactive flex min-h-11 items-center justify-center gap-2 rounded-xl px-3 text-sm font-semibold transition focus-visible:outline-2 focus-visible:outline-offset-2 ${
        active
          ? "bg-white text-slate-950 shadow-sm"
          : "text-slate-600 hover:text-slate-950"
      }`}
    >
      <Icon aria-hidden="true" size={18} /> {children}
    </button>
  );
}

function ProcessingOverlay() {
  return (
    <div
      className="absolute inset-0 grid place-items-center bg-slate-950/70 text-white"
      aria-live="polite"
    >
      <div className="flex items-center gap-3 rounded-xl bg-slate-900/90 px-4 py-3 text-sm font-semibold">
        <LoaderCircle className="animate-spin" aria-hidden="true" size={20} />{" "}
        Buscando producto
      </div>
    </div>
  );
}
