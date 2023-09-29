
import { createContext,  useState } from 'react'

const hoverElementContext = createContext( null );
const headerSelectedContext = createContext( 'home' );


function HoverElementProvider({children}) {
  const [hoveredElement, setHoveredElement] = useState('');
  const value = {hoveredElement, setHoveredElement};
  return (<hoverElementContext.Provider value={value}>{children}</hoverElementContext.Provider>);
}

function SelectedHeaderProvider({children}) {
  const [selectedHeader, setSelectedHeader] = useState('home');
  const value = {selectedHeader, setSelectedHeader};
  return (<headerSelectedContext.Provider value={value}>{children}</headerSelectedContext.Provider>);
}

export {  hoverElementContext, headerSelectedContext, 
  HoverElementProvider, SelectedHeaderProvider,
}