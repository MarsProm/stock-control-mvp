import { useQuery } from '@tanstack/react-query'
import { ArrowDownToLine, ArrowUpFromLine, History } from 'lucide-react'
import { useState } from 'react'
import { errorMessage } from '../../lib/api'
import { listMovements, listProducts } from '../products/product-api'

const dateTime = new Intl.DateTimeFormat('es-AR', {
  dateStyle: 'medium',
  timeStyle: 'short',
})

export function MovementHistoryPage() {
  const [productId, setProductId] = useState('')
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')

  const products = useQuery({
    queryKey: ['products', 'history-selector'],
    queryFn: () => listProducts({ size: 100 }),
  })
  const movements = useQuery({
    queryKey: ['movements', productId, from, to],
    queryFn: () => listMovements(productId, {
      from: from ? new Date(from).toISOString() : undefined,
      to: to ? new Date(to).toISOString() : undefined,
      size: 100,
    }),
    enabled: Boolean(productId),
  })

  return (
    <>
      <header className="mb-7">
        <p className="mb-2 text-sm font-semibold text-emerald-700">Trazabilidad</p>
        <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">Historial de movimientos</h1>
        <p className="mt-2 max-w-2xl text-slate-600">Consulta entradas y salidas por producto y periodo.</p>
      </header>

      <section className="mb-6 grid gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm md:grid-cols-3">
        <label className="grid gap-2 text-sm font-medium text-slate-700">
          Producto
          <select value={productId} onChange={(event) => setProductId(event.target.value)} className="form-input">
            <option value="">Selecciona un producto</option>
            {products.data?.content.map((product) => (
              <option key={product.id} value={product.id}>{product.code} - {product.name}</option>
            ))}
          </select>
        </label>
        <label className="grid gap-2 text-sm font-medium text-slate-700">
          Desde
          <input value={from} onChange={(event) => setFrom(event.target.value)} type="datetime-local" className="form-input" />
        </label>
        <label className="grid gap-2 text-sm font-medium text-slate-700">
          Hasta
          <input value={to} onChange={(event) => setTo(event.target.value)} type="datetime-local" className="form-input" />
        </label>
      </section>

      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        {!productId ? (
          <div className="grid place-items-center px-6 py-16 text-center">
            <History className="mb-4 text-slate-400" aria-hidden="true" size={40} />
            <h2 className="font-semibold">Selecciona un producto</h2>
            <p className="mt-1 text-sm text-slate-500">Su historial aparecera en esta seccion.</p>
          </div>
        ) : null}

        {movements.isPending && productId ? (
          <div className="space-y-3 p-5" aria-label="Cargando historial">
            {[1, 2, 3].map((item) => <div key={item} className="h-16 animate-pulse rounded-xl bg-slate-100" />)}
          </div>
        ) : null}

        {movements.isError ? (
          <p role="alert" className="m-5 rounded-xl bg-red-50 p-4 text-sm text-red-700">{errorMessage(movements.error)}</p>
        ) : null}

        {productId && movements.data?.content.length === 0 ? (
          <div className="px-6 py-16 text-center text-sm text-slate-500">No hay movimientos para los filtros elegidos.</div>
        ) : null}

        <div className="divide-y divide-slate-100">
          {movements.data?.content.map((movement) => {
            const entry = movement.type === 'ENTRY'
            const Icon = entry ? ArrowDownToLine : ArrowUpFromLine
            return (
              <article key={movement.id} className="flex items-start gap-4 px-5 py-4">
                <span className={`grid size-11 shrink-0 place-items-center rounded-xl ${entry ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
                  <Icon aria-hidden="true" size={20} />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                    <p className="font-semibold">{entry ? 'Entrada' : 'Salida'} de {movement.quantity} unidades</p>
                    <time className="text-xs text-slate-500" dateTime={movement.createdAt}>{dateTime.format(new Date(movement.createdAt))}</time>
                  </div>
                  <p className="mt-1 text-sm text-slate-600">{movement.reason}</p>
                  <p className="mt-2 text-xs font-medium text-slate-500">Saldo resultante: {movement.balanceAfter}</p>
                </div>
              </article>
            )
          })}
        </div>
      </section>
    </>
  )
}
