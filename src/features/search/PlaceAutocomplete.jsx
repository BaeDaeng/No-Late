import { useEffect, useId, useState } from 'react'
import { API_LIMITS } from '../../config/apiLimits.js'
import { toPlace } from '../../services/api/adapters.js'
import { apiClient } from '../../services/api/apiClient.js'

export function PlaceAutocomplete({ label, selected, onSelect, error }) {
  const inputId = useId()
  const [query, setQuery] = useState(selected?.name || '')
  const [items, setItems] = useState([])
  const [status, setStatus] = useState('')
  const [activeIndex, setActiveIndex] = useState(-1)
  useEffect(() => {
    const timer = setTimeout(() => setQuery(selected?.name || ''), 0)
    return () => clearTimeout(timer)
  }, [selected?.id, selected?.name])
  useEffect(() => {
    if (query.trim().length < 2 || query === selected?.name) return undefined
    const controller = new AbortController()
    const timer = setTimeout(async () => {
      try {
        setStatus('검색 중…')
        const data = await apiClient.searchPlaces(query.trim(), controller.signal)
        setItems((data.documents || []).map(toPlace))
        setStatus(data.documents?.length ? '' : '검색 결과가 없습니다.')
      } catch (requestError) {
        if (requestError.name !== 'AbortError') { setItems([]); setStatus('장소 검색에 실패했습니다. 다시 입력해 주세요.') }
      }
    }, API_LIMITS.placeSearchDebounceMs)
    return () => { clearTimeout(timer); controller.abort() }
  }, [query, selected?.name])

  const choose = (place) => { onSelect(place); setQuery(place.name); setItems([]); setStatus('') }
  const onKeyDown = (event) => {
    if (!items.length) return
    if (event.key === 'ArrowDown') { event.preventDefault(); setActiveIndex((index) => Math.min(index + 1, items.length - 1)) }
    if (event.key === 'ArrowUp') { event.preventDefault(); setActiveIndex((index) => Math.max(index - 1, 0)) }
    if (event.key === 'Enter' && activeIndex >= 0) { event.preventDefault(); choose(items[activeIndex]) }
    if (event.key === 'Escape') { setItems([]); setActiveIndex(-1) }
  }
  return <div className="autocomplete"><label htmlFor={inputId}>{label}</label><input id={inputId} value={query} onChange={(event) => { setQuery(event.target.value); onSelect(null); setActiveIndex(-1); setItems([]); setStatus('') }} onKeyDown={onKeyDown} placeholder="두 글자 이상 입력" autoComplete="off" aria-autocomplete="list" aria-expanded={items.length > 0} />{items.length > 0 && <ul className="suggestions" role="listbox">{items.map((place, index) => <li key={place.id} role="option" aria-selected={activeIndex === index}><button type="button" className={activeIndex === index ? 'active' : ''} onMouseDown={(event) => event.preventDefault()} onClick={() => choose(place)}><strong>{place.name}</strong><span>{place.address}</span></button></li>)}</ul>}{status && <p className="field-hint" role="status">{status}</p>}{error && <p className="field-error" role="alert">{error}</p>}</div>
}
