import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { ApiError } from '../../lib/api'
import { BarcodeScannerWorkflow } from './BarcodeScannerWorkflow'
import type { Product } from './types'

const api = vi.hoisted(() => ({
  createMovement: vi.fn(),
  createProduct: vi.fn(),
  getProductByCode: vi.fn(),
}))

vi.mock('./product-api', () => api)

const product: Product = {
  id: '311d833b-47c0-47bb-bc92-33044da7d0af',
  code: '7791234567890',
  name: 'Cafe molido',
  description: null,
  price: 8500,
  currentStock: 4,
  minimumStock: 5,
  lowStock: true,
  active: true,
  createdAt: '2026-08-11T20:00:00Z',
  updatedAt: '2026-08-11T20:00:00Z',
}

function renderWorkflow() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  })
  return render(
    <QueryClientProvider client={queryClient}>
      <BarcodeScannerWorkflow onClose={vi.fn()} />
    </QueryClientProvider>,
  )
}

async function scanWithUsb(code: string) {
  const user = userEvent.setup()
  await user.click(screen.getByRole('button', { name: 'Lector USB' }))
  await user.type(screen.getByLabelText('Codigo de barras'), `${code}{Enter}`)
}

describe('BarcodeScannerWorkflow', () => {
  it('opens a prefilled product form for an unknown barcode', async () => {
    api.getProductByCode.mockRejectedValueOnce(new ApiError(404, { detail: 'No existe el producto' }))
    renderWorkflow()

    await scanWithUsb('7791234567890')

    expect(await screen.findByRole('heading', { name: 'Nuevo producto' })).toBeInTheDocument()
    expect(screen.getByLabelText('Codigo')).toHaveValue('7791234567890')
    expect(screen.getByLabelText('Codigo')).toHaveAttribute('readonly')
    expect(screen.getByLabelText('Stock inicial')).toBeInTheDocument()
  })

  it('opens a confirmed stock movement for an existing active product', async () => {
    api.getProductByCode.mockResolvedValueOnce(product)
    renderWorkflow()

    await scanWithUsb(product.code)

    expect(await screen.findByRole('heading', { name: 'Movimiento de Cafe molido' })).toBeInTheDocument()
    expect(screen.getByLabelText('Cantidad')).toHaveValue(1)
    expect(screen.getByLabelText('Entrada')).toBeChecked()
  })

  it('does not allow movements for an inactive product', async () => {
    api.getProductByCode.mockResolvedValueOnce({ ...product, active: false })
    renderWorkflow()

    await scanWithUsb(product.code)

    expect(await screen.findByRole('heading', { name: 'Producto inactivo' })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Confirmar entrada' })).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Escanear siguiente' })).toBeInTheDocument()
  })
})
