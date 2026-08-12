import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { BarcodeScannerDialog } from './BarcodeScannerDialog'

const stopCamera = vi.fn()

vi.mock('@zxing/browser', () => ({
  BarcodeFormat: {
    EAN_13: 'EAN_13',
    EAN_8: 'EAN_8',
    UPC_A: 'UPC_A',
    UPC_E: 'UPC_E',
    CODE_128: 'CODE_128',
    CODE_39: 'CODE_39',
    ITF: 'ITF',
  },
  BrowserMultiFormatReader: class {
    decodeFromConstraints = vi.fn().mockResolvedValue({ stop: stopCamera })
  },
}))

vi.mock('@zxing/library', () => ({
  DecodeHintType: { POSSIBLE_FORMATS: 'POSSIBLE_FORMATS' },
}))

describe('BarcodeScannerDialog', () => {
  beforeEach(() => {
    stopCamera.mockClear()
    Object.defineProperty(navigator, 'mediaDevices', {
      configurable: true,
      value: undefined,
    })
  })

  it('submits a normalized code from a USB reader', async () => {
    const user = userEvent.setup()
    const onDetected = vi.fn().mockResolvedValue(undefined)
    render(<BarcodeScannerDialog onClose={vi.fn()} onDetected={onDetected} />)

    await user.click(screen.getByRole('button', { name: 'Lector USB' }))
    await user.type(screen.getByLabelText('Codigo de barras'), ' 7791234567890{Enter}')

    expect(onDetected).toHaveBeenCalledTimes(1)
    expect(onDetected).toHaveBeenCalledWith('7791234567890')
  })

  it('blocks duplicate submissions while a lookup is running', async () => {
    const user = userEvent.setup()
    const onDetected = vi.fn(() => new Promise<void>(() => undefined))
    render(<BarcodeScannerDialog onClose={vi.fn()} onDetected={onDetected} />)

    await user.click(screen.getByRole('button', { name: 'Lector USB' }))
    await user.type(screen.getByLabelText('Codigo de barras'), '7791234567890')
    const form = screen.getByRole('button', { name: 'Buscar codigo' }).closest('form')
    expect(form).not.toBeNull()

    fireEvent.submit(form!)
    fireEvent.submit(form!)

    expect(onDetected).toHaveBeenCalledTimes(1)
    expect(screen.getByRole('button', { name: 'Buscando producto' })).toBeDisabled()
  })

  it('offers the manual fallback when camera access is unavailable', async () => {
    render(<BarcodeScannerDialog onClose={vi.fn()} onDetected={vi.fn()} />)

    expect(await screen.findByRole('alert')).toHaveTextContent('Este navegador no permite usar la camara')
    expect(screen.getByRole('button', { name: 'Usar lector USB o entrada manual' })).toBeInTheDocument()
  })

  it('stops the camera when the dialog closes', async () => {
    Object.defineProperty(navigator, 'mediaDevices', {
      configurable: true,
      value: { getUserMedia: vi.fn() },
    })
    const onClose = vi.fn()
    const { unmount } = render(<BarcodeScannerDialog onClose={onClose} onDetected={vi.fn()} />)

    await waitFor(() => expect(screen.getByLabelText('Vista previa de la camara')).toBeInTheDocument())
    await new Promise((resolve) => setTimeout(resolve, 0))
    unmount()

    await waitFor(() => expect(stopCamera).toHaveBeenCalledTimes(1))
  })
})
