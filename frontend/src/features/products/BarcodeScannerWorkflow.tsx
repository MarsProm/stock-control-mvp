import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Archive, CheckCircle2, ScanBarcode, X } from 'lucide-react'
import { useCallback, useEffect, useRef, useState } from 'react'
import { ApiError, errorMessage } from '../../lib/api'
import { MovementForm } from '../movements/MovementForm'
import { BarcodeScannerDialog } from './BarcodeScannerDialog'
import { ProductForm } from './ProductForm'
import { createMovement, createProduct, getProductByCode } from './product-api'
import type { MovementInput, Product, ProductInput } from './types'

type WorkflowStage =
  | { kind: 'capture' }
  | { kind: 'create'; code: string }
  | { kind: 'movement'; product: Product }
  | { kind: 'inactive'; product: Product }
  | { kind: 'success'; title: string; detail: string }

type BarcodeScannerWorkflowProps = {
  onClose: () => void
}

export function BarcodeScannerWorkflow({ onClose }: BarcodeScannerWorkflowProps) {
  const queryClient = useQueryClient()
  const [stage, setStage] = useState<WorkflowStage>({ kind: 'capture' })

  const refreshInventory = useCallback(async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ['products'] }),
      queryClient.invalidateQueries({ queryKey: ['movements'] }),
    ])
  }, [queryClient])

  const create = useMutation({
    mutationFn: createProduct,
    onSuccess: async (product) => {
      await refreshInventory()
      setStage({
        kind: 'success',
        title: 'Producto creado',
        detail: `${product.name} fue registrado con ${product.currentStock} unidades.`,
      })
    },
  })

  const movement = useMutation({
    mutationFn: ({ productId, input }: { productId: string; input: MovementInput }) =>
      createMovement(productId, input),
    onSuccess: async (result) => {
      await refreshInventory()
      setStage({
        kind: 'success',
        title: 'Movimiento registrado',
        detail: `El nuevo saldo del producto es de ${result.balanceAfter} unidades.`,
      })
    },
  })

  const handleDetected = useCallback(async (code: string) => {
    try {
      const product = await getProductByCode(code)
      setStage(product.active ? { kind: 'movement', product } : { kind: 'inactive', product })
    } catch (error) {
      if (error instanceof ApiError && error.status === 404) {
        setStage({ kind: 'create', code })
        return
      }
      throw error
    }
  }, [])

  if (stage.kind === 'capture') {
    return <BarcodeScannerDialog onClose={onClose} onDetected={handleDetected} />
  }

  if (stage.kind === 'create') {
    return (
      <ProductForm
        initialCode={stage.code}
        error={create.isError ? errorMessage(create.error) : undefined}
        onCancel={() => setStage({ kind: 'capture' })}
        onSubmit={async (values: ProductInput) => {
          await create.mutateAsync(values)
        }}
      />
    )
  }

  if (stage.kind === 'movement') {
    return (
      <MovementForm
        product={stage.product}
        error={movement.isError ? errorMessage(movement.error) : undefined}
        onCancel={() => setStage({ kind: 'capture' })}
        onSubmit={async (input) => {
          await movement.mutateAsync({ productId: stage.product.id, input })
        }}
      />
    )
  }

  if (stage.kind === 'inactive') {
    return (
      <WorkflowMessageDialog
        tone="warning"
        title="Producto inactivo"
        detail={`${stage.product.name} (${stage.product.code}) esta inactivo y no admite movimientos de stock.`}
        onClose={onClose}
        onNext={() => setStage({ kind: 'capture' })}
      />
    )
  }

  return (
    <WorkflowMessageDialog
      tone="success"
      title={stage.title}
      detail={stage.detail}
      onClose={onClose}
      onNext={() => setStage({ kind: 'capture' })}
    />
  )
}

function WorkflowMessageDialog({
  tone,
  title,
  detail,
  onClose,
  onNext,
}: {
  tone: 'success' | 'warning'
  title: string
  detail: string
  onClose: () => void
  onNext: () => void
}) {
  const dialogRef = useRef<HTMLDialogElement>(null)

  useEffect(() => {
    const dialog = dialogRef.current
    if (!dialog) return
    if (typeof dialog.showModal === 'function') {
      dialog.showModal()
    } else {
      dialog.setAttribute('open', '')
    }
    return () => {
      if (typeof dialog.close === 'function' && dialog.open) dialog.close()
    }
  }, [])

  const Icon = tone === 'success' ? CheckCircle2 : Archive
  const iconStyle = tone === 'success' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-800'

  return (
    <dialog
      ref={dialogRef}
      onCancel={(event) => {
        event.preventDefault()
        onClose()
      }}
      aria-labelledby="scanner-result-title"
      className="fixed inset-0 m-auto w-[min(92vw,32rem)] max-w-none bg-transparent p-0 backdrop:bg-slate-950/60"
    >
      <section className="rounded-3xl bg-white p-6 text-center shadow-2xl sm:p-8">
        <button type="button" onClick={onClose} className="icon-button ml-auto" aria-label="Cerrar carga rapida">
          <X aria-hidden="true" size={20} />
        </button>
        <span className={`mx-auto mb-5 grid size-16 place-items-center rounded-2xl ${iconStyle}`}>
          <Icon aria-hidden="true" size={32} />
        </span>
        <h2 id="scanner-result-title" className="text-2xl font-semibold tracking-tight">{title}</h2>
        <p className="mx-auto mt-3 max-w-sm text-slate-600">{detail}</p>
        <div className="mt-7 grid gap-3 sm:grid-cols-2">
          <button type="button" onClick={onClose} className="button-secondary">Terminar</button>
          <button type="button" onClick={onNext} className="button-primary">
            <ScanBarcode aria-hidden="true" size={18} /> Escanear siguiente
          </button>
        </div>
      </section>
    </dialog>
  )
}
