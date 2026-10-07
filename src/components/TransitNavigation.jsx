export function TransitNavigation({ active, onNavigate }) {
  return <nav className="transit-navigation" aria-label="주요 서비스"><button className={active === 'route' ? 'active' : ''} type="button" onClick={() => onNavigate('/')}>길찾기</button><button className={active === 'subway' ? 'active' : ''} type="button" onClick={() => onNavigate('/subway')}>지하철</button><button className={active === 'bus' ? 'active' : ''} type="button" onClick={() => onNavigate('/bus')}>버스</button></nav>
}
