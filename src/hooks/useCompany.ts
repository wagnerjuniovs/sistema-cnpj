import { useEffect, useState } from 'react'
import { getCompany, type CompanyDetail } from '@/services/cnpj'
import { ApiError, errorMessage } from '@/services/api'

export function useCompany(cnpj: string | null, attempt = 0) {
  const [row, setRow] = useState<CompanyDetail | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [missing, setMissing] = useState(false)
  useEffect(() => {
    const controller = new AbortController()
    setRow(null); setError(''); setMissing(false); setLoading(!!cnpj)
    if (cnpj) getCompany(cnpj, controller.signal).then(result => {
      if (!controller.signal.aborted) { setRow(result); setLoading(false) }
    }).catch(cause => {
      if (controller.signal.aborted) return
      if (cause instanceof ApiError && cause.code === 'NOT_FOUND') setMissing(true)
      else setError(errorMessage(cause))
      setLoading(false)
    })
    return () => controller.abort()
  }, [cnpj, attempt])
  return { row, loading, error, missing }
}
